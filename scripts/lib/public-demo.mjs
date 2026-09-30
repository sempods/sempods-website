import assert from 'node:assert/strict';
import jsonld from 'jsonld';

export async function assertEvent(representation, base) {
  const expanded = await jsonld.expand(representation, { base });
  function nodes(value) {
    if (!value || typeof value !== 'object') return [];
    return [value, ...Object.values(value).flatMap(nodes)];
  }
  const eventNodes = nodes(expanded).filter(node =>
    node['@id'] === base && Array.isArray(node['@type']) && node['@type'].some(type => type === 'https://schema.org/Event'));
  assert.ok(eventNodes.some(node => 'https://schema.org/startDate' in node),
    'An Event has a startDate in the returned RDF');
}
