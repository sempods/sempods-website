import assert from 'node:assert/strict';
import { publicPod, publicQuery } from '../src/data/public-query.ts';

const query = await fetch(`${publicPod}/_system/sparql/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/sparql-query', Accept: 'application/sparql-results+json' },
  body: publicQuery,
  signal: AbortSignal.timeout(20000),
});
assert.equal(query.status, 200, 'Public query status');
assert.match(query.headers.get('content-type') ?? '', /application\/sparql-results\+json/, 'Public query media type');
const results = await query.json();
assert.deepEqual(results.head.vars, ['e', 'name', 'start'], 'Projected variables');
assert.equal(results.results.bindings.length, 3, 'The website demonstrates three events');
for (const row of results.results.bindings) {
  assert.equal(row.e.type, 'uri', 'Event address is a URI');
  assert.ok(row.name.value && row.start.value, 'Event name and date are present');
}
const event = results.results.bindings[0].e.value;
const resource = await fetch(event, {
  headers: { Accept: 'application/ld+json' },
  signal: AbortSignal.timeout(20000),
});
assert.equal(resource.status, 200, 'Event read status');
assert.match(resource.headers.get('content-type') ?? '', /application\/ld\+json/, 'Event media type');
const representation = await resource.json();
function nodes(value) {
  if (!value || typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(nodes)];
}
const eventNodes = nodes(representation).filter(node =>
  [node['@type']].flat().includes('https://schema.org/Event'));
assert.ok(eventNodes.some(node => 'https://schema.org/startDate' in node), 'An Event has a startDate in the returned RDF');
console.log(JSON.stringify({
  checkedAt: new Date().toISOString(), queryStatus: query.status,
  rows: results.results.bindings.length, event, eventStatus: resource.status,
}, null, 2));
