/*
 * The published coordinates, in one place.
 *
 * This is a stopgap and should be read as one. AGENTS.md says code examples come
 * from a compiled source, because `0.x` may break the public API and a snippet
 * that no longer compiles is worse than none. That source does not exist yet:
 * the plan is an `examples/quickstart` module in sempods-kotlin that builds
 * against the published artifacts, with the site pulling its text at build time.
 *
 * Until it does, keeping the version in exactly one file is the difference
 * between one place to forget and several. Do not inline these strings into a
 * page.
 */
export const SEMPODS_VERSION = '0.1.0';

export const gradleDependencies = `implementation(platform("org.sempods:sempods-bom:${SEMPODS_VERSION}"))
implementation("org.sempods:sempods-client")`;
