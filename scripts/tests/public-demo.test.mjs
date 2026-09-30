import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertEvent } from '../lib/public-demo.mjs';

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
