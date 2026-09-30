import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertEvent, assertEventRow } from '../lib/public-demo.mjs';

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
