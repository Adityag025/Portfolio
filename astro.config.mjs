import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://adityag025.vercel.app',
  integrations: [sitemap()],
});
