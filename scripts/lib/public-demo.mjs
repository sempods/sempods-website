import assert from 'node:assert/strict';
import jsonld from 'jsonld';

const xsd = 'http://www.w3.org/2001/XMLSchema#';
const langString = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString';
const schemaContext = 'https://schema.org/docs/jsonldcontext.jsonld';
const contextUrls = new Map([
  ['https://schema.org/', schemaContext],
  [schemaContext, schemaContext],
  ['http://schema.org/', schemaContext],
  ['http://schema.org/docs/jsonldcontext.jsonld', schemaContext],
]);

function isEventName(term) {
  if (term?.type !== 'literal' || typeof term.value !== 'string' || !term.value.trim()) return false;
  if (Object.hasOwn(term, 'xml:lang')) {
    return typeof term['xml:lang'] === 'string' && Boolean(term['xml:lang'].trim()) &&
      (term.datatype === undefined || term.datatype === langString);
  }
  return term.datatype === undefined || term.datatype === `${xsd}string`;
}

export function assertPublicEventUrl(event, pod) {
  const url = new URL(event);
  const base = new URL(pod);
  const decoded = new URL(decodeURIComponent(url.pathname), url.origin);
  assert.ok(url.protocol === 'https:' && url.origin === base.origin &&
    decoded.origin === base.origin && decoded.pathname.startsWith(`${base.pathname.replace(/\/$/, '')}/`) &&
    !url.username && !url.password,
  'Event read stays within the configured public pod');
}

function isEventDate(term) {
  if (term?.type !== 'literal' || typeof term.value !== 'string' || Object.hasOwn(term, 'xml:lang')) return false;
  const date = /^(-?(?:\d{4}|[1-9]\d{4,}))-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/.exec(term.value);
  if (!date) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction, zone] = date;
  const hasTime = hourText !== undefined;
  const datatype = term.datatype;
  if (datatype !== undefined && datatype !== `${xsd}string` && datatype !== `${xsd}date` && datatype !== `${xsd}dateTime` && datatype !== `${xsd}dateTimeStamp`) return false;
  if (datatype === `${xsd}date` && hasTime) return false;
  if ((datatype === `${xsd}dateTime` || datatype === `${xsd}dateTimeStamp`) && !hasTime) return false;
  if (datatype === `${xsd}dateTimeStamp` && !zone) return false;
  const year = BigInt(yearText);
  const leap = year % 4n === 0n && (year % 100n !== 0n || year % 400n === 0n);
  const month = Number(monthText), day = Number(dayText);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1]) return false;
  if (hasTime) {
    const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText);
    if (hour > 24 || minute > 59 || second > 59) return false;
    if (hour === 24 && (minute || second || /[1-9]/.test(fraction ?? ''))) return false;
  }
  if (zone && zone !== 'Z') {
    const hour = Number(zone.slice(1, 3)), minute = Number(zone.slice(4));
    if (hour > 14 || minute > 59 || hour === 14 && minute !== 0) return false;
  }
  return true;
}

export function assertEventRow(row) {
  assert.equal(row.e.type, 'uri', 'Event address is a URI');
  assert.ok(typeof row.e.value === 'string' && row.e.value.trim(), 'Event address is present');
  assert.ok(isEventName(row.name), 'Event name is a nonempty literal with a string-compatible datatype');
  assert.ok(isEventDate(row.start), 'Event start is a literal calendar date or date-time');
}

export async function assertEvent(representation, base, { request = fetch, timeoutMs = 20000 } = {}) {
  const signal = AbortSignal.timeout(timeoutMs);
  const documentLoader = async url => {
    const destination = contextUrls.get(new URL(url).href);
    assert.ok(destination, `Remote JSON-LD context is not allowed: ${url}`);
    const response = await request(destination, {
      headers: { Accept: 'application/ld+json, application/json' },
      redirect: 'error', signal,
    });
    assert.equal(response.status, 200, 'Remote context status');
    return { contextUrl: null, documentUrl: destination, document: await response.json() };
  };
  const flattened = await jsonld.flatten(representation, null, { base, documentLoader });
  function nodes(value) {
    if (!value || typeof value !== 'object') return [];
    return [value, ...Object.values(value).flatMap(nodes)];
  }
  const eventNodes = nodes(flattened).filter(node =>
    node['@id'] === base && Array.isArray(node['@type']) && node['@type'].some(type => type === 'https://schema.org/Event'));
  assert.ok(eventNodes.some(node => node['https://schema.org/startDate']?.some(value =>
    isEventDate({ type: 'literal', value: value['@value'], datatype: value['@type'],
      ...(Object.hasOwn(value, '@language') ? { 'xml:lang': value['@language'] } : {}) }))),
    'An Event has a startDate literal calendar date or date-time in the returned RDF');
}
