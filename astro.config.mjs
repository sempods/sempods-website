// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The site is served from www.sempods.org. `sempods.org` itself is the pod URI
// namespace — every first path segment there is a pod name — so the website
// cannot live under it. See docs/roadmaps/website.md in the planning repo.
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
