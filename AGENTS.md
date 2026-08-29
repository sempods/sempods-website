# sempods website

The site at [www.sempods.org](https://www.sempods.org). Static, Astro, published to
GitHub Pages. The apex [sempods.org](https://sempods.org) can also show the
website, but do not present it as a public pod-hosting entry UI.

**This file described a Next.js chat app until 2026-08-27.** That iteration is over —
the chat is deferred, not deleted, and lives in this repository's history. If you are
looking for the streaming chat UI, the API route or `ANTHROPIC_API_KEY`, none of them
are part of the current site by decision.

## Stack

- **Astro**, static output, no runtime
- **Pagefind** for search, run over `dist/` as part of `npm run build`
- **GitHub Pages**, deployed by `.github/workflows/deploy.yml` on push to `main`
- No webfonts, no client JavaScript beyond the search widget

Why Pages and not Netlify: Netlify manages an apex and its `www` as a pair and cannot
serve `www.sempods.org` without also claiming `sempods.org`. Concrete pod URLs can
also live under the apex, for example `https://sempods.org/aaltra`, so domain
routing must stay explicit. `public/CNAME` is the GitHub Pages setup here.

Do not link `https://sempods.org` as though it were a hosting dashboard. There is no
public entry UI for pod hosting yet. Specific pod URLs such as
`https://sempods.org/aaltra` are fine when the page is intentionally pointing at a
concrete pod.

## Content

**The prose here is independent of the repositories.** `docs/` in `sempods-kotlin` is
written for implementers; rewriting it to suit a website would make it worse as a
specification. Link to it, do not absorb it.

**Code examples are the exception, and it is not stylistic.** `0.x` may break the
public API, so a snippet that no longer compiles is worse than none — it is the first
thing a visitor tries, and the impression is not "stale docs" but "does not work".
Examples come from a compiled source in the reference implementation. **Never type a
new code example straight into a page.** If you need one that does not exist yet, say
so rather than inventing it.

The same rule applies to live queries: if a page claims the response contains
something, run the query and check that it does. A `SELECT` that omits the variable
the surrounding paragraph talks about is exactly the kind of error a reader finds in
ten seconds.

The chatbot knowledge base that fed the previous site is **not in this repository**.
A trimmed copy sat at `_legacy-content/` until 2026-08-29 and was deleted: nothing
built from it, and the full 24 files live in the private planning repo under
`sempods/internal/website/content/`. Mine that, do not paste it — it was written for
a model to answer from, not for a human to read, and parts of it are out of date.

## Tone

The chatbot system prompt in that knowledge base remains the best statement of voice
the project has, and the site inherits it: conviction earned by argument rather than enthusiasm,
openly unfinished as a strength rather than something to hide, skeptics welcome, never
salesy. "Here is what it does, and here is what it does not do yet."

**sempods** is always lowercase, even at the start of a sentence. It is "a pod", never
"a sempod". w2d2d stands for "What to do today?" and is explained on first mention.

Two rules in that prompt are chatbot rules and do **not** apply here:

- *Third person.* It stops an assistant from impersonating the founder. A website
  speaks for the project, and the origin page is specifically where first person
  belongs.
- *"No single core, six innovations together."* Right for a chat that must not be
  talked out of its position; fatal for a website, where six equal concepts are no
  concept. The site explains exactly one — **contexts** — and hangs the rest off it.

## Structure

Show what is visible, explain what is not. A curl can demonstrate semantic structure,
linked data and decentralisation — it cannot show permissions, which is why contexts
is the one explained concept.

The home page leads with a working, unauthenticated query against a live pod. That
placement is deliberate and should survive edits: it proves the claim in ten seconds
where a paragraph only asserts it.

## Language

English only. Ten pages become twenty otherwise, and with one maintainer the second
set goes stale. URLs carry **no language prefix** (`/use-cases/events`, never
`/en/use-cases/events`) so Astro's `prefixDefaultLocale: false` can add `/de/` later
without moving an existing URL.

## Decisions

Structure and the reasoning behind it: `docs/website.md` in the private planning
repo; what is still open is workstream B of `docs/roadmaps/go-live.md` beside it.
Read them before proposing a change to the information architecture — most of it has
already been argued through once.
