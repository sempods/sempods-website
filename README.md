# sempods website

The site at [www.sempods.org](https://www.sempods.org). Astro, static, published to
GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.
`https://sempods.org` can also show the website, but it is not a public
pod-hosting dashboard.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # astro build, then pagefind over dist/
```

## Why Pages and explicit pod URLs

Netlify manages an apex domain and its `www` as a pair: it cannot serve
`www.sempods.org` without also claiming `sempods.org`. Concrete pod URLs can also
live under the apex, for example `https://sempods.org/aaltra`, so domain routing
must stay explicit. Pages has no such coupling — `public/CNAME` carries the
GitHub Pages domain and that is the whole setup here.

Do not link `https://sempods.org` as though it were a hosting dashboard. There is
no public entry UI for pod hosting yet. Link concrete pod URLs directly when a
page intentionally points at a pod.

## Content

The prose here is **independent** of the repositories. `docs/` in
`sempods-kotlin` is written for implementers, and rewriting it to suit a website
would make it worse as a specification.

The exception is **code examples**: `0.x` may break the public API, so a snippet
that no longer compiles is worse than none — it is the first thing a visitor
tries. Those come from a compiled source in the reference implementation rather
than being typed here.

## State

Every page carries real copy; none of them are skeletons. What the site still owes
is a compiled source for code examples — every snippet should come from something
that builds, and none does yet. The reasoning behind the structure is recorded in
`docs/website.md` in the planning repo, and what is still open is workstream B of
`docs/roadmaps/go-live.md` beside it.

## Licensing

Two licences, because this repository holds two kinds of thing — the split
`CONTRIBUTING` already draws across the project:

- **`LICENSE` — CC BY 4.0** covers the content: the pages, the prose, the
  diagrams. Same licence as [`sempods-spec`](https://github.com/sempods/sempods-spec),
  and the reason the repository reads as CC BY on GitHub. The text is the product
  here.
- **`LICENSE-CODE` — Apache 2.0** covers the code: the Astro configuration,
  layouts, components and build setup. Same licence as
  [`sempods-kotlin`](https://github.com/sempods/sempods-kotlin).

Reuse a page: attribute it. Reuse the layout machinery: Apache terms.
