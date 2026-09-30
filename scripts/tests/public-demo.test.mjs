import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertEvent, assertEventRow, assertPublicEventUrl } from '../lib/public-demo.mjs';

const event = 'https://pod.example/events/one';

test('an expanded event with a date is accepted', async () => {
  await assertEvent([{
    '@id': event,
    '@type': ['https://schema.org/Event'],
    'https://schema.org/startDate': [{ '@value': '2026-09-30', '@type': 'http://www.w3.org/2001/XMLSchema#date' }],
  }], event);
});

test('compacted terms and keyword aliases in a named graph are expanded', async () => {
  await assertEvent({
    '@context': { '@vocab': 'https://schema.org/', id: '@id', type: '@type', graph: '@graph' },
    id: 'https://pod.example/graph',
    graph: [{ id: event, type: 'Event', startDate: '2026-09-30' }],
  }, event);
});

test('prefixed Event and date terms are expanded', async () => {
  await assertEvent({
    '@context': { schema: 'https://schema.org/' },
    '@id': event, '@type': 'schema:Event', 'schema:startDate': '2026-09-30',
  }, event);
});

test('an IRI containing the Event IRI is not the Event type', async () => {
  await assert.rejects(assertEvent({
    '@id': event,
    '@type': 'https://other.example/https://schema.org/Event',
    'https://schema.org/startDate': '2026-09-30',
  }, event), /An Event has a startDate/);
});

test('unrelated JSON properties are not RDF predicates', async () => {
  await assert.rejects(assertEvent({
    '@context': { Event: 'https://schema.org/Event' },
    '@id': event, '@type': 'Event', startDate: '2026-09-30',
  }, event), /An Event has a startDate/);
});

test('an unrelated Event cannot stand in for the fetched resource', async () => {
  await assert.rejects(assertEvent({
    '@context': { '@vocab': 'https://schema.org/' },
    '@graph': [
      { '@id': event, '@type': 'Place', name: 'Venue' },
      { '@id': 'https://pod.example/events/other', '@type': 'Event', startDate: '2026-09-30' },
    ],
  }, event));
});

test('the fetched Event URI must be present in the representation', async () => {
  await assert.rejects(assertEvent({
    '@context': { '@vocab': 'https://schema.org/' },
    '@id': 'https://pod.example/events/other', '@type': 'Event', startDate: '2026-09-30',
  }, event));
});

test('a relative node identifier is resolved against the fetched URI', async () => {
  await assertEvent({
    '@context': { '@vocab': 'https://schema.org/' },
    '@id': './one', '@type': 'Event', startDate: '2026-09-30',
  }, event);
});

const xsd = 'http://www.w3.org/2001/XMLSchema#';
const row = start => ({ e: { type: 'uri', value: event }, name: { type: 'literal', value: 'An event', 'xml:lang': 'en' }, start });
const validDates = [
  { type: 'literal', value: '2026-09-30' },
  { type: 'literal', value: '2024-02-29', datatype: `${xsd}date` },
  { type: 'literal', value: '2026-09-30+02:00', datatype: `${xsd}date` },
  { type: 'literal', value: '2026-09-30T19:30:00Z', datatype: `${xsd}dateTime` },
  { type: 'literal', value: '2026-09-30T19:30:00.123+02:00', datatype: `${xsd}dateTimeStamp` },
  { type: 'literal', value: '2026-09-30T19:30:00', datatype: `${xsd}string` },
  { type: 'literal', value: '2026-09-30T24:00:00.000-14:00', datatype: `${xsd}dateTime` },
];
for (const term of validDates) {
  test(`a literal date ${term.value} is accepted`, () => assertEventRow(row(term)));
}

const invalidDates = [
  { type: 'uri', value: 'https://example.org/date' },
  { type: 'bnode', value: 'date' },
  { type: 'literal', value: 'sometime soon' },
  { type: 'literal', value: '2026-02-29' },
  { type: 'literal', value: '2026-04-31' },
  { type: 'literal', value: '2026-13-01' },
  { type: 'literal', value: '2026-09-30T24:01:00Z' },
  { type: 'literal', value: '2026-09-30T24:00:00.1Z' },
  { type: 'literal', value: '2026-09-30T19:60:00Z' },
  { type: 'literal', value: '2026-09-30T19:30:00+14:01' },
  { type: 'literal', value: '2026-09-30', datatype: `${xsd}integer` },
  { type: 'literal', value: '2026-09-30', datatype: `${xsd}dateTime` },
  { type: 'literal', value: '2026-09-30T19:30:00Z', datatype: `${xsd}date` },
  { type: 'literal', value: '2026-09-30T19:30:00', datatype: `${xsd}dateTimeStamp` },
];
for (const term of invalidDates) {
  test(`an invalid date ${term.type} ${term.value} (${term.datatype ?? 'untyped'}) is rejected`, () => {
    assert.throws(() => assertEventRow(row(term)), /Event start is a literal calendar date/);
  });
}

for (const term of [{ type: 'uri', value: 'https://example.org/name' }, { type: 'bnode', value: 'name' }, { type: 'literal', value: '  ' }]) {
  test(`an invalid name ${term.type} is rejected`, () => {
    assert.throws(() => assertEventRow({ ...row(validDates[0]), name: term }), /Event name is a nonempty literal/);
  });
}

test('a resource-valued startDate cannot stand in for a date literal', async () => {
  await assert.rejects(assertEvent({
    '@id': event, '@type': 'https://schema.org/Event',
    'https://schema.org/startDate': { '@id': 'https://example.org/date' },
  }, event), /startDate literal calendar date/);
});

test('an invalid startDate literal in the fetched RDF is rejected', async () => {
  await assert.rejects(assertEvent({
    '@id': event, '@type': 'https://schema.org/Event',
    'https://schema.org/startDate': 'sometime soon',
  }, event), /startDate literal calendar date/);
});

test('a language-tagged date binding is rejected while a language-tagged name is accepted', () => {
  const start = { type: 'literal', value: '2026-09-30', 'xml:lang': 'en' };
  assert.throws(() => assertEventRow(row(start)), /Event start is a literal calendar date/);
  assertEventRow(row({ type: 'literal', value: '2026-09-30' }));
});

test('a language tag cannot be combined with an accepted date datatype', () => {
  assert.throws(() => assertEventRow(row({ type: 'literal', value: '2026-09-30', datatype: `${xsd}date`, 'xml:lang': 'en' })), /Event start is a literal calendar date/);
});

test('a language-tagged date in expanded JSON-LD is rejected', async () => {
  await assert.rejects(assertEvent([{
    '@id': event, '@type': ['https://schema.org/Event'],
    'https://schema.org/startDate': [{ '@value': '2026-09-30', '@language': 'en' }],
  }], event), /startDate literal calendar date/);
});

test('a context default language cannot turn date text into an accepted date', async () => {
  await assert.rejects(assertEvent({
    '@context': { '@vocab': 'https://schema.org/', '@language': 'en' },
    '@id': event, '@type': 'Event', startDate: '2026-09-30',
  }, event), /startDate literal calendar date/);
});

test('an explicit date datatype overrides a context default language', async () => {
  await assertEvent({
    '@context': { '@vocab': 'https://schema.org/', '@language': 'en', startDate: { '@id': 'https://schema.org/startDate', '@type': `${xsd}date` } },
    '@id': event, '@type': 'Event', startDate: '2026-09-30',
  }, event);
});

test('type and date in separate descriptions of the same RDF node are accepted', async () => {
  await assertEvent([
    { '@id': event, '@type': ['https://schema.org/Event'] },
    { '@id': event, 'https://schema.org/startDate': [{ '@value': '2026-09-30', '@type': `${xsd}date` }] },
  ], event);
});

for (const datatype of [`${xsd}integer`, `${xsd}boolean`, `${xsd}date`, 'https://example.org/custom']) {
  test(`a non-text name datatype ${datatype} is rejected`, () => {
    assert.throws(() => assertEventRow({ ...row(validDates[0]), name: { type: 'literal', value: '42', datatype } }), /Event name is a nonempty literal/);
  });
}

for (const name of [
  { type: 'literal', value: '42' },
  { type: 'literal', value: 'A venue', datatype: `${xsd}string` },
  { type: 'literal', value: 'Eine Veranstaltung', 'xml:lang': 'de' },
  { type: 'literal', value: 'An event', 'xml:lang': 'en', datatype: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString' },
]) {
  test(`a text-compatible name ${JSON.stringify(name)} is accepted`, () => {
    assertEventRow({ ...row(validDates[0]), name });
  });
}

test('a langString name needs a language and cannot use a numeric datatype', () => {
  for (const name of [
    { type: 'literal', value: 'An event', datatype: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString' },
    { type: 'literal', value: 'An event', 'xml:lang': '', datatype: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString' },
    { type: 'literal', value: '42', 'xml:lang': 'en', datatype: `${xsd}integer` },
  ]) assert.throws(() => assertEventRow({ ...row(validDates[0]), name }), /Event name is a nonempty literal/);
});

const schemaContext = 'https://schema.org/docs/jsonldcontext.jsonld';
const remoteRepresentation = context => ({
  '@context': context, '@id': event, '@type': 'https://schema.org/Event',
  'https://schema.org/startDate': { '@value': '2026-09-30', '@type': `${xsd}date` },
});
const contextResponse = () => new Response(JSON.stringify({ '@context': { '@vocab': 'https://schema.org/' } }), { headers: { 'Content-Type': 'application/ld+json' } });

for (const context of ['http://127.0.0.1/context', 'http://localhost/context', 'https://untrusted.example/context', 'https://schema.org.untrusted.example/context', 'file:///private/context.json', 'data:application/ld+json,{}', 'https://schema.org:444/docs/jsonldcontext.jsonld', 'https://user:pass@schema.org/docs/jsonldcontext.jsonld', 'https://schema.org/docs/jsonldcontext.jsonld?next=http://localhost']) {
  test(`a context destination is rejected before network access: ${context}`, async () => {
    let requests = 0;
    await assert.rejects(assertEvent(remoteRepresentation(context), event, {
      request: async () => { requests++; return contextResponse(); },
    }));
    assert.equal(requests, 0);
  });
}

for (const context of ['https://schema.org', 'https://schema.org/', schemaContext, 'http://schema.org', 'http://schema.org/', 'http://schema.org/docs/jsonldcontext.jsonld', 'https://SCHEMA.ORG:443']) {
  test(`an allowlisted context uses HTTPS, no redirects and a deadline: ${context}`, async () => {
    let requests = 0;
    await assertEvent(remoteRepresentation(context), event, {
      request: async (url, options) => {
        requests++;
        assert.equal(url, schemaContext);
        assert.equal(options.redirect, 'error');
        assert.ok(options.signal instanceof AbortSignal);
        return contextResponse();
      },
    });
    assert.equal(requests, 1);
  });
}

test('a remote context redirect is rejected without following its Location', async () => {
  let requests = 0;
  await assert.rejects(assertEvent(remoteRepresentation(schemaContext), event, {
    request: async () => {
      requests++;
      return new Response('', { status: 302, headers: { Location: 'http://127.0.0.1/private' } });
    },
  }));
  assert.equal(requests, 1);
});

test('an allowed context cannot import a private-network context', async () => {
  let requests = 0;
  await assert.rejects(assertEvent(remoteRepresentation(schemaContext), event, {
    request: async () => {
      requests++;
      return new Response(JSON.stringify({ '@context': 'http://127.0.0.1/private' }));
    },
  }));
  assert.equal(requests, 1);
});

test('remote context requests share one deadline per verification', async () => {
  const signals = [];
  await assertEvent(remoteRepresentation(['https://schema.org', 'https://schema.org/']), event, {
    request: async (_, options) => { signals.push(options.signal); return contextResponse(); },
  });
  assert.equal(signals.length, 2);
  assert.equal(signals[0], signals[1]);
});

test('an unavailable remote context aborts instead of hanging verification', async () => {
  let signal;
  await assert.rejects(assertEvent(remoteRepresentation(schemaContext), event, {
    timeoutMs: 25,
    request: async (_, options) => {
      signal = options.signal;
      if (signal.aborted) throw signal.reason;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve(contextResponse()), 1000);
        signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
      });
    },
  }));
  assert.equal(signal.aborted, true);
});

test('the selected event read is restricted to the configured HTTPS pod', () => {
  const pod = 'https://sempods.org/aaltra';
  assertPublicEventUrl(`${pod}/events/one`, pod);
  for (const url of ['http://127.0.0.1/private', 'https://elsewhere.example/event', 'https://sempods.org/aaltra-copy/event', 'https://sempods.org/another-pod/event', 'https://user:pass@sempods.org/aaltra/event', 'http://sempods.org/aaltra/event', 'https://sempods.org/aaltra/%2e%2e%2fprivate']) {
    assert.throws(() => assertPublicEventUrl(url, pod), /Event read stays within the configured public pod/);
  }
});
