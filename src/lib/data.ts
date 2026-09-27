export const profile = {
  name: 'Aditya Gupta',
  role: 'Full Stack Developer',
  company: 'ODigMa Consultancy Solutions Limited',
  location: 'Bengaluru, India',
  email: 'addoindia025@gmail.com',
  phone: '+91-6302047625',
  phoneHref: 'tel:+916302047625',
  github: 'https://github.com/Adityag025',
  githubLabel: 'github.com/Adityag025',
  linkedin: 'https://linkedin.com/in/devadityagupta',
  linkedinLabel: 'linkedin.com/in/devadityagupta',
  resume: '/Aditya-Gupta-Resume.pdf',
  site: 'https://aditya-gupta-full-stack-developer.vercel.app',
};

export const heroMetrics = [
  { value: '2', unit: 'yrs', label: 'Full stack, in production' },
  { value: '10+', unit: '', label: 'Live client sites' },
  { value: '−18', unit: '%', label: 'Bounce rate' },
  { value: '−25', unit: '%', label: 'Page load time' },
];

export type StackGroup = {
  id: string;
  title: string;
  note: string;
  items: string[];
  span: 'wide' | 'tall' | 'base';
};

export const stack: StackGroup[] = [
  {
    id: 'frontend',
    title: 'Frontend',
    note: 'Server-first React. Client JS only where it earns its weight.',
    items: ['React 19', 'Next.js 16', 'App Router', 'Server Components', 'Redux', 'Tailwind CSS', 'Framer Motion', 'GSAP'],
    span: 'wide',
  },
  {
    id: 'backend',
    title: 'Backend & APIs',
    note: 'Validated at the edge of every boundary.',
    items: ['Laravel 12', 'Node.js', 'Express.js', 'REST API design', 'Server Actions', 'Auth.js', 'JWT', 'Zod', 'Filament 3'],
    span: 'tall',
  },
  {
    id: 'languages',
    title: 'Languages',
    note: 'Typed where it matters.',
    items: ['TypeScript', 'JavaScript (ES6+)', 'PHP', 'Java', 'SQL', 'HTML5', 'CSS3'],
    span: 'base',
  },
  {
    id: 'data',
    title: 'Databases & caching',
    note: 'Relational by default, cached on purpose.',
    items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Prisma ORM', 'Mongoose', 'Redis'],
    span: 'base',
  },
  {
    id: 'devops',
    title: 'DevOps & testing',
    note: 'If it isn’t tested it isn’t done.',
    items: ['Git', 'Docker', 'GitHub Actions', 'Vercel', 'Vitest', 'Pest', 'PHPUnit', 'Postman'],
    span: 'base',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    note: 'Where the leads actually land.',
    items: ['Salesforce LeadGen API', 'TeleCRM', 'Server-Sent Events', 'MCP SDK'],
    span: 'wide',
  },
];

export type Project = {
  id: string;
  name: string;
  kind: string;
  summary: string;
  stack: string[];
  highlights: string[];
  figure: { value: string; label: string };
  featured?: boolean;
  demo?: { url: string; note: string };
};

export const projects: Project[] = [
  {
    id: 'flowboard',
    name: 'FlowBoard',
    kind: 'Multi-tenant issue tracker',
    summary:
      'A Kanban issue tracker with workspace-scoped auth, real-time sync across tabs and users, and LLM summaries that come back instantly the second time.',
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'PostgreSQL', 'Prisma', 'Redis', 'Auth.js', 'Docker', 'Vitest', 'SSE'],
    highlights: [
      'Drag-and-drop Kanban ordered with fractional indexing, so a move writes one row instead of re-numbering the column.',
      'Real-time sync over Server-Sent Events fanned out through Redis pub/sub.',
      'LLM issue summaries cached in Redis: repeat latency dropped from ~13s to under 100ms.',
      'Workspace-scoped authorization covered by 150+ Vitest tests; multi-stage Docker build.',
    ],
    figure: { value: '13s → <100ms', label: 'repeat summary latency' },
    demo: { url: 'https://flowboard-theta-ten.vercel.app/', note: 'Sign-in required. Create a free account to try it.' },
    featured: true,
  },
  {
    id: 'saas-cms',
    name: 'SaaS site & headless CMS',
    kind: 'Laravel API + Next.js frontend',
    summary:
      'A Filament-powered admin behind a versioned JSON API, feeding a typed Next.js marketing site.',
    stack: ['Laravel 12', 'Filament 3', 'Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Zod', 'Pest'],
    highlights: [
      'Versioned JSON API over 30+ relational models with role-based permissions.',
      'Activity audit log on every content change.',
      'Frontend across 15+ routes, every API response parsed with Zod.',
      '50+ Pest unit tests on the API layer.',
    ],
    figure: { value: '30+', label: 'models behind one versioned API' },
  },
  {
    id: 'microsites',
    name: 'Real estate microsite suite',
    kind: 'CMS + Salesforce lead engine',
    summary:
      'Ten-plus project microsites on a lightweight custom CMS, each capturing campaign leads straight into Salesforce.',
    stack: ['PHP', 'MySQL', 'jQuery', 'Bootstrap 5', 'Salesforce REST API'],
    highlights: [
      'Delivered 10+ project microsites on a custom lightweight CMS.',
      'Campaign lead capture mapping 33 fields, including UTM and GCLID attribution, into Salesforce LeadGen endpoints.',
      'Server-side validation, spam filtering, request logging and failure fallbacks so no lead is dropped.',
    ],
    figure: { value: '33', label: 'fields mapped per lead' },
  },
  {
    id: 'corporate',
    name: 'Corporate site & leads dashboard',
    kind: 'WordPress theme + PHP dashboard',
    summary:
      'A custom theme driving listings across a main site and six subdomains, with an authenticated leads dashboard for the sales team.',
    stack: ['WordPress', 'ACF', 'PHP', 'MySQL', 'Rank Math'],
    highlights: [
      'One custom theme powering listings on the main site and 6 subdomains.',
      'Dedicated PHP leads dashboard behind authentication.',
    ],
    figure: { value: '1 + 6', label: 'site and subdomains, one theme' },
  },
  {
    id: 'mcp',
    name: 'Figma MCP server',
    kind: 'Developer tooling',
    summary:
      'A Model Context Protocol server that lets AI coding assistants read Figma files as tools.',
    stack: ['Node.js', 'MCP SDK', 'Figma API'],
    highlights: [
      'Exposes Figma file structure and component data as callable tools for AI coding assistants.',
    ],
    figure: { value: 'MCP', label: 'Figma → AI assistant tools' },
  },
];

export type LiveSite = {
  id: string;
  name: string;
  client?: string;
  kind: 'Platform' | 'Corporate site' | 'Landing page';
  summary: string;
  built: string;
  url: string;
  status: 'live' | 'staging' | 'gated';
};

/** Client sites shipped at ODigMa. `id` matches the preview image in /public/sites. */
export const liveSites: LiveSite[] = [
  { id: 'ehswatch', name: 'EHSWatch', kind: 'Platform', summary: 'AI-native EHSQ software for high-risk industries across the GCC', built: 'Next.js · headless CMS', url: 'https://ehswatch.com/', status: 'live' },
  { id: 'agrim', name: 'AGRIM A3', kind: 'Platform', summary: 'Invite-only access portal for a private-markets fund platform', built: 'Custom · Bootstrap', url: 'https://agrim.fund/', status: 'gated' },
  { id: 'tvs-emerald', name: 'TVS Emerald', kind: 'Corporate site', summary: 'Real estate developer: 22 residential projects across 2 cities', built: 'WordPress', url: 'https://www.tvsemerald.com/', status: 'live' },
  { id: 'nbr', name: 'NBR Group', kind: 'Corporate site', summary: 'Luxury apartments and villas across Bengaluru', built: 'Laravel', url: 'https://www.nbrgroup.in/', status: 'live' },
  { id: 'mana', name: 'Mana Projects', kind: 'Corporate site', summary: 'Bengaluru builder with 26+ years and 30+ projects', built: 'WordPress', url: 'https://www.manaprojects.com/', status: 'live' },
  { id: 'vars', name: 'Vars Builders', kind: 'Corporate site', summary: 'Residential, commercial and other verticals under one brand', built: 'WordPress', url: 'https://www.varsbuilders.com/', status: 'live' },
  { id: 'elenza', name: 'Elenza', kind: 'Corporate site', summary: 'Modular kitchens, wardrobes and full home interiors', built: 'WordPress', url: 'https://elenzaindia.com/', status: 'live' },
  { id: 'serenova', name: 'Serenova', client: 'Merusri', kind: 'Landing page', summary: 'A 167-plot prairie-planned community in North Bengaluru', built: 'Custom · jQuery', url: 'https://merusriserenova.com/', status: 'live' },
  { id: 'arbor', name: 'Codename Arbor', client: 'Puravankara', kind: 'Landing page', summary: 'Pre-launch residential project off Judicial Layout, Bengaluru', built: 'Custom · Bootstrap', url: 'https://stage.odigma.com/codename-arbor/', status: 'staging' },
  { id: 'eden', name: 'Echoes of Eden', kind: 'Landing page', summary: 'Ultra-luxury residences, launch campaign page', built: 'Custom · Bootstrap', url: 'https://stage.odigma.com/echoes-of-eden/', status: 'staging' },
];

export const experience = [
  {
    role: 'Full Stack Developer',
    org: 'ODigMa Consultancy Solutions Limited',
    period: 'Apr 2024 — Present',
    place: 'Bengaluru, India',
    points: [
      'Own client web projects end to end, from Laravel backends to Next.js frontends.',
      'Built fault-tolerant CRM integrations with Salesforce LeadGen API and TeleCRM: server-side validation, spam filtering, request logging and failure fallbacks for zero lead loss.',
      'Delivered and maintain 10+ live client sites across 4 brands in Agile teams.',
      'Cut bounce rate by 18% and page load time by 25% with semantic markup, lazy loading and deliberate caching.',
    ],
  },
];

export const education = {
  degree: 'Bachelor of Computer Applications (BCA)',
  school: 'Bengaluru City University',
  detail: 'CGPA 7.90 · Graduated 2021',
};

export const honors = [
  { year: '2025', title: 'Rising Star Award', org: 'ODigMa' },
  { year: '2023', title: 'Data Analytics Certification', org: 'Certification' },
  { year: '2021', title: '2nd Prize, ECG Game', org: 'Competition' },
];
