# Verify website examples

`src/data/release.json` records the implementation tag and full commit independently
of the specification revision. `src/data/coordinates.ts` supplies both the displayed
BOM dependencies and the consumer fixture's dependencies. Node.js 22.18+ is required
for the verification script's TypeScript import.

Extract the `install` and `public-read` regions from the selected release's
`DocumentationExamplesTest.kt`:

```bash
npm run examples:sync -- --kotlin /path/to/sempods-kotlin
npm run examples:sync -- --kotlin /path/to/sempods-kotlin --check
```

The generated `src/data/client-examples.json` records the commit, source path,
source hash, region names and compiler version. Extraction fails if the tag disagrees
with the manifest, the manifest version differs from tagged `gradle.properties`, or either
region is missing or duplicated. `--check` fails if the recorded snippets differ from
the release source. The working checkout may be on the
next snapshot; extraction uses the tag.

Run the displayed dependencies and unchanged regions in a separate consumer:

```bash
JAVA_HOME=/path/to/jdk-25 npm run examples:verify -- --gradle /path/to/gradlew
```

Install JDK 21 beside the build JDK. The fixture resolves released artifacts from
Maven Central, compiles with the release's Kotlin compiler and runs on Java 21. A
loopback HTTP server supplies the pod URL and resource IRI. Assertions check the
response status, exact body and absence of an Authorization header. The generated
fixture directory is printed for inspection. It does not use project substitution,
a live write or real credentials.

The server is stopped even if client installation fails; client resources are closed
after a successful installation. Verify the initialization failure path with the
published dependencies:

```bash
JAVA_HOME=/path/to/jdk-25 SEMPODS_TEST_GRADLE=/path/to/gradlew \
  node --test scripts/integration-tests/published-example.test.mjs
```

This test injects a throwing installation in a disposable copy and requires the
consumer JVM to exit with that failure. It uses a two-minute deadline and terminates
the fixture process group if cleanup regresses. The website's recorded snippets are
unchanged.

This verifies the displayed core-client read, not optional adapters, deployment setup
or all release behavior. Live-query and editorial checks belong to the
[release procedure](release-website.md).
