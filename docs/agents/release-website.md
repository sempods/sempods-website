# Update the website for a release

Use this procedure after an implementation or specification release, or when reviewing a change
in project direction. Read the website's [AGENTS.md](../../AGENTS.md) first. Website prose has its
own audience; link technical contracts rather than copying their chapters.

An assessment produces a source record, a page-by-page decision and check results. A request to
prepare the update stops there. A request to update the website also implements the decisions and
verifies the rendered result. Follow the existing GitHub Pages workflow for publication when
requested; pushing to `main` publishes the site.

## Establish the sources

Record the requested release, previous website baseline, full source commits and dirty state.
Resolve the baseline from the last website update, not automatically from the previous release:
the site may have missed several. If it is unknown, say so and review current claims in full.

Keep these identities separate:

| Source | Answers |
|---|---|
| Implementation release notes, tag, migration guide and tested source | What this release provides, removes and requires |
| The release's `gradle.properties` and vendored requirement index | Which specification version the implementation claims to implement |
| Selected specification commit: normative chapters, OpenAPI, vocabulary and governance | What the contract requires at that revision |
| Vision and proposal disposition, with adoption links | Where the project is heading; what remains proposed |
| Running public services | What a visitor can try now |
| Website instructions and current pages | Voice, reader journey and existing claims |

Read implementation evidence at the release tag, even if the checkout has already started the next
snapshot. Read the specification as a consistent snapshot. A `-dev` version needs a commit; record
core and module versions independently. Do not infer that matching release numbers mean matching
contracts, or that publishing an implementation deploys it to every public host.

Use GitHub Releases as release-note evidence. If network access fails, retain the local tag
evidence and mark publication, artifact availability or live checks unverified. Missing evidence
blocks only the corresponding claim. A merged proposal is not normative adoption; a roadmap is not
implementation evidence. Resolve source disagreement through the responsible source, not website copy.

## Decide whether the story needs to change

Before editing sentences, compare the source changes with the site's central explanation:

- Has the purpose or audience changed? Can the same opening explain why someone should care?
- Has a mechanism become optional, replaceable or implementation-specific? Does navigation still
  make it look like a requirement for every pod?
- Have the specification, libraries, services and deployments become different entry points?
- Does the first demonstration still prove the opening claim? Is the next action still achievable?

Choose and explain the smallest sufficient intervention: factual corrections, a rewritten page
or journey, changed information architecture, or visual redesign. A version bump alone warrants
no redesign. A changed organizing concept warrants reviewing headings, ordering, diagrams and
calls to action together. Preserve the early public demonstration when it still proves the story.
Preserve incoming URLs; a moved page needs a verified redirect and updated internal links.

## Review every surface

Review these on every release, even if the conclusion is “keep”:

| Surface | Check |
|---|---|
| Home | Promise, organizing idea, demo, diagrams, status lists and first next step |
| How it works; concepts index and every concept page | Core versus module versus implementation, authorization language, diagrams and concept ordering |
| Start | Reader-specific entry paths, coordinates, module choice, runtime, setup, downloads, migration and operator expectations |
| Use cases | Working evidence versus scenarios, removed capabilities and unsupported product claims |
| Roadmap | Delivered items, current public issues, proposed work, dates and availability promises |
| Links | Repository roles, moved guides, release links, artifact and hosting destinations |
| Layout, metadata and assets | Navigation, titles, descriptions, JSON-LD, social previews, alt text and captions |
| Search and published output | Indexed text, route continuity, sitemap, canonical URLs and links |
| Instructions and example sources | Rules that assume the previous architecture; ownership and validation of snippets |

For each material claim record its owner, source revision, affected surfaces, status and decision.
Statuses should distinguish released implementation, current normative contract, verified live
service, proposed direction and unknown. Decisions are keep, rewrite, move, remove or defer with
a reason. Search for old type names, versions, routes, configuration defaults and obsolete claims;
literal matches are review candidates, not automatic errors.

## Select features by what a reader can do

Read highlights, breaking changes, deprecations, migration guidance and known limitations. Include
a change where it changes a reader's next action or gives the central claim useful evidence.
Explain the benefit, scope and one next step. Replace obsolete capabilities rather than adding a
second list. Keep internal refactors in release notes unless they change an entry path.

Distinguish implementation extensions from portable specification features. Do not turn optional
MCP, media, OIDC or context lifecycle support into an obligation for every pod. Do not describe
server-resolved grants as permissions carried in a token. Conformance discovery requirements and
a running implementation's actual discovery endpoint are separate checks; no suite means no
certification claim. Synchronization, billing and universal upgrade support need their own evidence.

## Check examples, installation and downloads

Every executable example needs source at the selected release and a recorded check. Kotlin and
Java snippets come from compiled source; never repair an old example by inventing a new call in
Astro. Prefer existing tested documentation regions. Import or extract them reproducibly with
the source commit and region recorded. Include the imports, parameters and fixture context a
reader needs, or link the complete example. A source test against project dependencies proves
that source API; separately verify a minimal consumer against the published artifacts before
claiming the published quickstart works. If that consumer or extraction does not exist, report
the gap and link the verified guide instead of claiming a pipeline exists.

For an implemented update, record the selected sources in `src/data/release.json`.
Keep the implementation version, tag and full commit consistent; select the specification commit
and core/module versions separately. Run the [example pipeline](example-pipeline.md): extraction
from the selected tag, `--check`, then the independent published-artifact consumer. Update the
manifest and extraction together. Neither a successful old fixture nor a fresh source extraction
alone verifies a newly selected publication.

Check BOM version, artifact availability, optional adapters, language/API names and per-module
runtime requirements. Separate build JDK from runtime JDK and bytecode target. Installation text
names prerequisites, configuration defaults, credentials, expected results and its intended use.
Test local commands on a disposable fixture when implementing a revised setup. Link migration
guidance for breaking changes. Production operation, backups, version transitions and recovery
belong to the concrete deployment; a development composition is not an update-supported distribution.

For each live example, run the exact anonymous query and check status, media type, projected
variables and the data the prose claims. Follow a returned resource IRI and check the representation.
A SELECT result does not necessarily contain the RDF predicates used in its query. Distinguish
“demonstrates a contract” from “proves interoperability across implementations”. Use public reads;
do not create data, clients or accounts to validate a public demo. Record time and outcome. `npm run demo:verify` runs the exact shared query, checks the
three projected event rows, and reads a returned URI to verify an Event with a start date. It
requires public network access and does not identify the deployed release. A temporary failure calls for an honest fallback, not an invented response or deletion of the concept.

Release links use immutable revisions. Explicit “latest development” links may follow `main`.
Container tags and source labels do not prove a digest, a deployment version or an upgrade path.
Verify availability before adding a download button or recommending an image version.

## Preserve the reading flow

Write a short editorial brief before the page changes: who is reading, the promise, the single
organizing idea, the concrete proof, and the next action. State what changed in that brief when
direction changes. Read the whole affected page and its incoming/outgoing journey after editing.

- Build from a reader's problem to a concrete result, then explain what makes it possible.
- Put a feature where the reader needs it. Avoid appending a release paragraph to every page.
- Explain a term before depending on it. Use the same nouns for the contract, the implementation
  and the deployment across headlines, diagrams and links.
- Keep paragraphs to one point. Earn conviction through the example and its consequence; use
  direct verbs. Avoid superlatives, corporate language and an expanding parade of standards.
- Put a limitation beside the relevant action, in one clear sentence with a useful next step.
  Keep vision motivating and visibly distinct from something the visitor can use today.
- Remove the sentence or section the new material replaces. Brief repetition can orient readers;
  copied status lists and competing explanations create drift.
- Inspect rendered word boundaries around inline links and code. Astro may discard newline
  whitespace; use explicit spaces where required. Separate adjacent action links textually as
  well as visually, so search indexes complete words.

Read the headings alone, then the page aloud, then follow the calls to action as a new visitor.
Ask whether the reader can explain the idea and take the next step without visiting release notes.
Factual edits are incomplete if their transitions, headings or metadata still tell the old story.

## Collect and verify the result

Run the local inventory with explicit sources:

```bash
npm run audit:release -- --kotlin /path/to/sempods-kotlin --spec /path/to/sempods-spec \
  --release v0.2.0 --previous v0.1.0 --spec-ref <full-spec-commit>
```

It prints JSON for source identities, changed paths, page surfaces, review candidates and literal
links into both source repositories. It performs no network checks or edits and does not decide
claim validity. Compare its output with the previous assessment; it cannot infer an unrecorded
baseline or validate dynamic links, prose, anchors or code. Read all pages, including those without
matches. Save generated evidence outside published pages and label it as a revision-specific report.

An assessment ends with the source record, redesign decision, page matrix, feature decisions,
example/setup gaps, proposed editorial brief and remaining uncertainty. Keep it distinct from a
maintained roadmap. Public implementation work follows the repositories' issue/PR conventions.

When applying an update, run `npm run check` and `npm run build`, then check generated output:

```bash
npm run check:rendered -- --kotlin /path/to/sempods-kotlin --spec /path/to/sempods-spec
```

The Python standard-library helper checks local links, images and anchors, including links
rendered from JavaScript helpers. It checks GitHub source paths and heading anchors against the
revision in each rendered URL, and flags joined words at inline elements. Its Markdown slug
check covers ordinary headings; inspect custom rendering when it reports uncertainty. It does
not check remote availability, arbitrary external links or editorial truth. A new build is required
before each run; existing `dist/` may describe older source.

Inspect desktop and narrow-screen rendering of changed journeys.
Check code wrapping, diagrams, keyboard navigation, search, metadata and the early demo. Run the
tests owning changed examples and, where required, the published-artifact consumer. Record actual
results and bounded failures; a successful Astro build proves neither API accuracy nor good prose.

## Later automation

A release-triggered job can resolve revisions, collect this inventory and give an agent the same
assessment task. Use the implementation repository plus immutable release tag as its idempotency
key; update an existing review when revising the assessment. A specification-only change gets its
own source identity and must not silently change the implementation pin.

Store the reviewed source commits and example provenance with the resulting change, so the next
run has a baseline. The agent can prepare a patch and PR when requested. Publication is a separate
requested action through the existing deployment workflow. The source inventory, release
manifest, example extraction, published consumer, public-demo check and rendered link checks
are available locally. No scheduled job is installed by this procedure. Release-event
delivery, runner access and idempotent review/PR updates still need implementation and verification
before calling it unattended automation.
