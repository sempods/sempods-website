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

For a release assessment or website update, follow the
[release procedure](docs/agents/release-website.md). `npm run audit:release -- --help`
shows the local inventory command. The inventory collects review evidence; it does not
validate examples or public services. After a fresh build,
`npm run check:rendered -- --kotlin /path/to/sempods-kotlin --spec /path/to/sempods-spec`
checks rendered local/source links, stylesheets, scripts, media assets and inline word boundaries. It requires Python 3.
`npm run demo:verify` checks the anonymous public query and a returned event with network access,
expanding JSON-LD before checking RDF terms. `npm run test:release` runs offline regression tests
for manifest validation, rendered links/assets and public-demo results.

The [0.2.0 assessment](docs/reviews/0.2.0.md) records the first review and its evidence.
The Codex [release skill](skills/sempods-website-release/SKILL.md) is versioned here;
the personal installation in `~/.codex/skills/sempods-website-release` is a copy.

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

The website is reviewed against Kotlin 0.2.0 and an independently pinned specification
revision in `src/data/release.json`. The [update report](docs/reviews/0.2.0-update.md)
records the editorial decisions and verification.

Client snippets are extracted from the tagged implementation's documentation tests.
The [example pipeline](docs/agents/example-pipeline.md) checks that extraction and runs
the displayed dependencies and snippets against Maven Central on Java 21. The public
SPARQL query has one source shared by the home and start pages.

The structure's original reasoning remains in `docs/website.md` in the private planning
repo. Reassess its outstanding work against the current release procedure and report.

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
