import { NextResponse } from 'next/server';
import { processLead } from '@/lib/leads';

export const runtime = 'nodejs';

const MAX_BODY = 8_000;

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let body: { lead?: unknown; crmFails?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
  }

  // Nothing is persisted and nothing reaches a real CRM — this endpoint
  // runs the validation + mapping pipeline and reports what it did.
  const result = await processLead(body.lead, {
    runtime: 'server',
    crmFails: body.crmFails === true,
  });
  const status = result.status === 'rejected' && result.trace.some((s) => s.stage === 'validate' && s.level === 'error') ? 422 : 200;
  return NextResponse.json(result, { status, headers: { 'Cache-Control': 'no-store' } });
}
