---
name: "UC5: Knowledge Publishing (LOD)"
description: Pods as nodes in a decentralized knowledge graph — Linked Open Data with provenance
type: use-case
---

# UC5 — Knowledge Publishing (Linked Open Data)

**Pods as nodes in a decentralized knowledge graph.**

Organizations or individuals publish structured data in public contexts. Any pod,
app, or agent can reference and consume it via standard HTTP URIs.

## What it enables

- Museums publish collection metadata as Linked Open Data
- Researchers publish datasets with provenance (Linked Data Signatures)
- Cities publish open data (events, facilities, transport) from sovereign pods
- Cross-pod queries via federated SPARQL (e.g. Comunica)

## How it works

Public contexts make pod data accessible without authentication. Combined with
Linked Data Signatures, resources carry cryptographic provenance — a web of trust
where anyone can verify who published what.

## Status

The foundation exists (public contexts, URI dereferencing). Missing: Linked Data
Signatures, federation tooling.
