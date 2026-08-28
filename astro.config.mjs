// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The canonical site URL stays on www for GitHub Pages output. The apex can
// also show the website, while concrete pod URLs may live below it, such as
// https://sempods.org/aaltra.
export default defineConfig({
  site: 'https://www.sempods.org',
  integrations: [sitemap()],

  // No language prefix on the default locale: /use-cases/events, never
  // /en/use-cases/events. That keeps a later `/de/` additive — no existing URL
  // has to move — without carrying the cost of a second tree today.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: { prefixDefaultLocale: false },
  },

  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
  },
});
