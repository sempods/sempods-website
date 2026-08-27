---
name: "UC3: Decentralized Events"
description: Venues publish events as Linked Open Data from their own pods — no central platform needed
type: use-case
---

# UC3 — Decentralized Event Platform

**Venues publish events as Linked Open Data from their own pods.**

Each venue operates a pod. Events are `schema:Event` resources in public contexts,
accessible via HTTP without authentication. Any app, website, or agent can consume
them.

## What it enables

- Venue websites pull event data directly from their pod (no CMS duplication)
- Aggregator apps combine events from any number of pods
- AI agents answer "What's happening this weekend?" from live pod data
- No central event platform needed — each venue is sovereign

## Live example

`https://sempods.org/aaltra/events/` serves real event data as JSON-LD. The
venue aaltra (Chemnitz) uses Eventer with a paid subscription. Their website
consumes event data directly from the pod.

You can query it right now:
```sparql
SELECT ?event ?name ?startDate WHERE {
  ?event a schema:Event ;
         schema:name ?name ;
         schema:startDate ?startDate .
} ORDER BY ?startDate
```

## How it works

```
pod.venue-a.example
    └── /events  (public-read, schema:Event resources)

pod.venue-b.example
    └── /events  (public-read, schema:Event resources)

aggregator-app (e.g. w2d2d)
    └── reads from both pods → unified event view
```

No central database. No API keys. No platform dependency. Each venue owns their
data. Aggregators combine freely.

## What exists today

- aaltra (Chemnitz) and other venues use Eventer with paid subscriptions
- ~10 pods publish events consumed by the w2d2d aggregator app
- Real users, real data, real value delivered today
