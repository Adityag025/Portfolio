import type { Metadata, Viewport } from 'next';
import { Geist, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { Toaster } from 'sonner';
import { Cursor } from '@/components/cursor/Cursor';
import { SmoothScroll } from '@/components/SmoothScroll';
import { ContactPalette } from '@/components/ContactPalette';
import { profile } from '@/lib/data';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', weight: ['400', '500', '600'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', weight: ['400', '500'] });

const title = 'Aditya Gupta — Full Stack Developer';
const description =
  'Full Stack Developer in Bengaluru building high-throughput backends, resilient Salesforce and TeleCRM integrations, and Next.js frontends. Includes a live lead-engine dashboard.';

export const metadata: Metadata = {
  metadataBase: new URL(profile.site),
  title,
  description,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: '/', title, description, images: [{ url: '/og.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
  authors: [{ name: profile.name, url: profile.site }],
};

export const viewport: Viewport = { themeColor: '#0a0a0c', colorScheme: 'dark' };

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  jobTitle: profile.role,
  worksFor: { '@type': 'Organization', name: profile.company },
  address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressCountry: 'IN' },
  url: profile.site,
  sameAs: [profile.github, profile.linkedin],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${grotesk.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS as available before paint so reveal targets start hidden (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-bg">
          Skip to content
        </a>
        {children}
        <ContactPalette />
        <SmoothScroll />
        <Cursor />
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--color-raised)',
              border: '1px solid var(--color-line)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </body>
    </html>
  );
}
