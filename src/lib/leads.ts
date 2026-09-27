import { z } from 'zod';

/* ------------------------------------------------------------------
   Lead pipeline — the same shape as the production integrations:
   validate → spam score → attribution → 33-field map → CRM push,
   with a durable fallback when the CRM is unavailable.
   Runs on the server (/api/leads) and, if that is unreachable,
   in the browser so the dashboard still works offline.
------------------------------------------------------------------- */

const indianMobile = /^(?:\+?91[-\s]?)?[6-9]\d{9}$/;

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  phone: z.string().trim().regex(indianMobile, 'Not a valid Indian mobile number'),
  project: z.string().min(1),
  configuration: z.string().min(1),
  budget: z.string().min(1),
  message: z.string().max(500).default(''),
  consent: z.literal(true),
  website: z.string().max(0).default(''), // honeypot — must stay empty
  formStartedAt: z.number().int().positive(),
  landingPage: z.string(),
  referrer: z.string().default(''),
  userAgent: z.string().default(''),
  utm: z.object({
    source: z.string().default(''),
    medium: z.string().default(''),
    campaign: z.string().default(''),
    term: z.string().default(''),
    content: z.string().default(''),
  }),
  gclid: z.string().default(''),
  fbclid: z.string().default(''),
});

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;

export const SALESFORCE_FIELDS = [
  'FirstName', 'LastName', 'Email', 'Phone', 'MobilePhone', 'LeadSource', 'Status',
  'Project__c', 'Configuration__c', 'Budget__c', 'Description', 'Consent__c', 'City',
  'Country', 'UTM_Source__c', 'UTM_Medium__c', 'UTM_Campaign__c', 'UTM_Term__c',
  'UTM_Content__c', 'GCLID__c', 'FBCLID__c', 'Landing_Page__c', 'Referrer__c',
  'Form_Name__c', 'Device__c', 'Browser__c', 'Submitted_At__c', 'Session_Id__c',
  'Spam_Score__c', 'Channel__c', 'Sub_Source__c', 'Attribution_Model__c', 'Pipeline_Version__c',
] as const;

export type TraceLevel = 'info' | 'ok' | 'warn' | 'error';
export type TraceStep = { stage: string; level: TraceLevel; detail: string; ms: number };

export type LeadResult = {
  id: string;
  status: 'synced' | 'queued' | 'rejected';
  rejectedFor?: 'spam' | 'invalid';
  source: string;
  campaign: string;
  project: string;
  name: string;
  gclid: string;
  spamScore: number;
  fieldCount: number;
  totalMs: number;
  trace: TraceStep[];
  runtime: 'server' | 'browser';
};

const DISPOSABLE = ['mailinator.com', 'tempmail.dev', '10minutemail.com', 'guerrillamail.com'];

export function spamScore(lead: Lead, now: number): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const domain = lead.email.split('@')[1]?.toLowerCase() ?? '';
  if (DISPOSABLE.includes(domain)) { score += 0.6; reasons.push(`disposable domain ${domain}`); }
  if (now - lead.formStartedAt < 2500) { score += 0.5; reasons.push('form filled in under 2.5s'); }
  if (/(https?:\/\/|www\.)/i.test(lead.message)) { score += 0.4; reasons.push('link in message'); }
  if (/(.)\1{5,}/.test(lead.name + lead.message)) { score += 0.3; reasons.push('repeated characters'); }
  return { score: Math.min(1, Number(score.toFixed(2))), reasons };
}

function channelFor(lead: Lead) {
  if (lead.gclid) return 'Paid Search';
  if (lead.fbclid) return 'Paid Social';
  if (lead.utm.medium === 'email') return 'Email';
  if (lead.utm.source) return 'Campaign';
  return lead.referrer ? 'Referral' : 'Direct';
}

export function mapToSalesforce(lead: Lead, spam: number, sessionId: string) {
  const [first, ...rest] = lead.name.split(/\s+/);
  const phone = lead.phone.replace(/\D/g, '').slice(-10);
  const ua = lead.userAgent.toLowerCase();
  const record: Record<(typeof SALESFORCE_FIELDS)[number], string | boolean | number> = {
    FirstName: first,
    LastName: rest.join(' ') || first,
    Email: lead.email.toLowerCase(),
    Phone: `+91${phone}`,
    MobilePhone: `+91${phone}`,
    LeadSource: 'Web',
    Status: 'Open - Not Contacted',
    Project__c: lead.project,
    Configuration__c: lead.configuration,
    Budget__c: lead.budget,
    Description: lead.message,
    Consent__c: lead.consent,
    City: 'Bengaluru',
    Country: 'India',
    UTM_Source__c: lead.utm.source,
    UTM_Medium__c: lead.utm.medium,
    UTM_Campaign__c: lead.utm.campaign,
    UTM_Term__c: lead.utm.term,
    UTM_Content__c: lead.utm.content,
    GCLID__c: lead.gclid,
    FBCLID__c: lead.fbclid,
    Landing_Page__c: lead.landingPage,
    Referrer__c: lead.referrer,
    Form_Name__c: 'enquire-now',
    Device__c: /mobile|android|iphone/.test(ua) ? 'Mobile' : 'Desktop',
    Browser__c: /firefox/.test(ua) ? 'Firefox' : /safari/.test(ua) && !/chrome/.test(ua) ? 'Safari' : 'Chrome',
    Submitted_At__c: new Date().toISOString(),
    Session_Id__c: sessionId,
    Spam_Score__c: spam,
    Channel__c: channelFor(lead),
    Sub_Source__c: lead.utm.content || lead.utm.term || 'organic',
    Attribution_Model__c: 'last-non-direct-click',
    Pipeline_Version__c: 'v3',
  };
  return record;
}

const rid = (prefix: string) =>
  `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

/** Runs the full pipeline. `crmFails` forces the fallback path for the demo. */
export async function processLead(
  input: unknown,
  opts: { runtime: 'server' | 'browser'; crmFails?: boolean },
): Promise<LeadResult> {
  const t0 = performance.now();
  const trace: TraceStep[] = [];
  const at = () => Math.round(performance.now() - t0);
  const push = (stage: string, level: TraceLevel, detail: string) =>
    trace.push({ stage, level, detail, ms: at() });

  push('ingest', 'info', `POST /api/leads · ${opts.runtime}`);
  const base = { id: rid('LD-'), runtime: opts.runtime, fieldCount: 0 } as const;

  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    push('validate', 'error', `zod: ${issue.path.join('.') || 'body'} — ${issue.message}`);
    return {
      ...base, status: 'rejected', rejectedFor: 'invalid', source: '—', campaign: '—', project: '—', name: '—',
      gclid: '', spamScore: 1, totalMs: at(), trace,
    };
  }
  const lead = parsed.data;
  push('validate', 'ok', `zod: schema ok · ${Object.keys(lead).length} keys`);

  const { score, reasons } = spamScore(lead, Date.now());
  const summary = {
    ...base, source: lead.utm.source || 'direct', campaign: lead.utm.campaign || '—',
    project: lead.project, name: lead.name, gclid: lead.gclid, spamScore: score,
  };
  if (score >= 0.5) {
    push('spam', 'warn', `score ${score.toFixed(2)} · ${reasons.join(', ')}`);
    push('result', 'warn', 'rejected — logged to spam_leads, not sent to CRM');
    return { ...summary, status: 'rejected', rejectedFor: 'spam', totalMs: at(), trace };
  }
  push('spam', 'ok', `score ${score.toFixed(2)} · passed`);

  const attribution = [
    lead.utm.source && `utm_source=${lead.utm.source}`,
    lead.utm.campaign && `utm_campaign=${lead.utm.campaign}`,
    lead.gclid && `gclid=${lead.gclid.slice(0, 10)}…`,
  ].filter(Boolean);
  push('attribution', 'ok', attribution.length ? attribution.join(' · ') : 'no campaign params · direct');

  const record = mapToSalesforce(lead, score, rid('s_'));
  const fieldCount = Object.keys(record).length;
  push('map', 'ok', `${fieldCount} fields → Salesforce Lead`);

  // Simulated CRM round-trip.
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
  if (opts.crmFails) {
    push('crm', 'error', 'POST /services/data/v61.0/sobjects/Lead → 503');
    push('fallback', 'warn', 'queued in lead_outbox · retry with backoff in 30s');
    return { ...summary, fieldCount, status: 'queued', totalMs: at(), trace };
  }
  push('crm', 'ok', `POST /services/data/v61.0/sobjects/Lead → 201 · ${rid('00Q')}`);
  push('log', 'info', 'request logged · lead_log#' + Math.floor(Math.random() * 90000 + 10000));
  return { ...summary, fieldCount, status: 'synced', totalMs: at(), trace };
}

/* ---------------- demo lead generator ---------------- */

const FIRST = ['Ananya', 'Rohit', 'Kavya', 'Arjun', 'Meera', 'Vikram', 'Sneha', 'Karthik', 'Divya', 'Nikhil', 'Priya', 'Rahul'];
const LAST = ['Iyer', 'Sharma', 'Reddy', 'Nair', 'Menon', 'Rao', 'Kulkarni', 'Hegde', 'Pillai', 'Joshi'];
const PROJECTS = ['Altura', 'Cascadia', 'Serene Springs', 'Udyana', 'Verde Vista'];
const CONFIGS = ['2 BHK', '3 BHK', '3.5 BHK', '4 BHK Villa'];
const BUDGETS = ['₹80L–1Cr', '₹1–1.5Cr', '₹1.5–2Cr', '₹2Cr+'];
const SOURCES: { source: string; medium: string; campaign: string; gclid: boolean; fbclid: boolean }[] = [
  { source: 'google', medium: 'cpc', campaign: 'altura_brand_search', gclid: true, fbclid: false },
  { source: 'google', medium: 'cpc', campaign: 'villas_generic', gclid: true, fbclid: false },
  { source: 'facebook', medium: 'paid_social', campaign: 'udyana_launch', gclid: false, fbclid: true },
  { source: 'instagram', medium: 'paid_social', campaign: 'cascadia_reels', gclid: false, fbclid: true },
  { source: 'newsletter', medium: 'email', campaign: 'sept_inventory', gclid: false, fbclid: false },
  { source: '', medium: '', campaign: '', gclid: false, fbclid: false },
];
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const token = (n: number) =>
  Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'[Math.floor(Math.random() * 64)]).join('');

export function fakeLead(opts: { spam?: boolean } = {}): LeadInput {
  const first = pick(FIRST);
  const last = pick(LAST);
  const src = pick(SOURCES);
  const spam = opts.spam ?? false;
  return {
    name: `${first} ${last}`,
    email: spam ? `${first.toLowerCase()}${Math.floor(Math.random() * 999)}@mailinator.com` : `${first}.${last}@gmail.com`.toLowerCase(),
    phone: `+91${pick(['9', '8', '7', '6'])}${Math.floor(100000000 + Math.random() * 899999999)}`,
    project: pick(PROJECTS),
    configuration: pick(CONFIGS),
    budget: pick(BUDGETS),
    message: spam ? 'Best SEO services visit www.example-seo.biz' : '',
    consent: true,
    website: '',
    formStartedAt: Math.round(Date.now() - (spam ? 900 : 8000 + Math.random() * 40000)),
    landingPage: `/projects/${pick(PROJECTS).toLowerCase().replace(/\s+/g, '-')}`,
    referrer: src.source === 'google' ? 'https://www.google.com/' : '',
    userAgent: Math.random() > 0.35 ? 'Mozilla/5.0 (Linux; Android 14) Mobile Chrome' : 'Mozilla/5.0 (Macintosh) Chrome',
    utm: { source: src.source, medium: src.medium, campaign: src.campaign, term: '', content: '' },
    gclid: src.gclid ? `Cj0KCQjw${token(24)}` : '',
    fbclid: src.fbclid ? `IwAR${token(20)}` : '',
  };
}
