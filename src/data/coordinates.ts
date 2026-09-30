import release from './release.json' with { type: 'json' };

export const SEMPODS_VERSION = release.implementation.version;
export const SEMPODS_RELEASE_URL = `https://github.com/sempods/sempods-kotlin/releases/tag/${release.implementation.tag}`;

export const implementationDoc = (path: string) =>
  `https://github.com/sempods/sempods-kotlin/blob/${release.implementation.tag}/${path}`;

export const specificationDoc = (path: string) =>
  `https://github.com/sempods/sempods-spec/blob/${release.specification.commit}/${path}`;

export const gradleDependencies = `dependencies {
  implementation(platform("org.sempods:sempods-bom:${SEMPODS_VERSION}"))
  implementation("org.sempods:sempods-client")
}`;
