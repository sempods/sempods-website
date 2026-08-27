# sempods website

The site at [www.sempods.org](https://www.sempods.org). Astro, static, published to
GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # astro build, then pagefind over dist/
```

## Why Pages, and why not the apex

Netlify manages an apex domain and its `www` as a pair: it cannot serve
`www.sempods.org` without also claiming `sempods.org`. That host is the pod server,
so the certificate request never completes and the domain configuration stays
locked. Pages has no such coupling — `public/CNAME` carries the domain and that is
the whole setup.

The site cannot live on `sempods.org` itself either, and that is architecture
rather than convenience: every first path segment there is a pod name
(`sempods.org/{pod}/{path}`). A multi-page site would permanently take `/about`,
`/start` and every other top-level path out of the pod namespace, and those
identifiers are promised not to change.

## Content

The prose here is **independent** of the repositories. `docs/` in
`sempods-kotlin` is written for implementers, and rewriting it to suit a website
would make it worse as a specification.

The exception is **code examples**: `0.x` may break the public API, so a snippet
that no longer compiles is worse than none — it is the first thing a visitor
tries. Those come from a compiled source in the reference implementation rather
than being typed here.

`_legacy-content/` is the previous chatbot knowledge base, kept as raw material.
It is written for a model to answer from, not for a human to read, and parts of it
are out of date. Mine it, do not paste it.

## State

Home and Start carry draft copy. How it works, Use cases and Roadmap are skeletons.
The decisions behind the structure — and what is still open — are recorded in
`docs/roadmaps/website.md` in the planning repo.
