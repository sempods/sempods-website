---
name: Technical Architecture
description: Deep dive into pod architecture — contexts, permissions, SPARQL sandbox, OAuth, MCP, AI layer
type: tech
---

# Technical Architecture

## The Context Model

The context (named graph) is the central primitive. Everything is built on it:

- **Storage** — every RDF statement belongs to exactly one context
- **Permissions** — read/write/manage per context
- **SPARQL sandbox** — queries only see readable contexts
- **Vector search** — results filtered by readable contexts
- **MCP** — agent access scoped by contexts
- **PubSub** — subscriptions per context
- **Sync** — federation at context level

This is unusual. Most systems use different concepts for different concerns
(roles for permissions, tables for storage, topics for pub/sub, indexes for
search). SemPods uses one concept for all of them.

**Consequence:** new features don't require new permission models. The complexity
stays flat as capabilities grow.

## Permission Model

Three permissions, always on contexts:

- `read` — can read statements in this context (CRUD GET, SPARQL, search)
- `write` — can add/modify/delete statements in this context
- `manage` — can create sub-contexts, register shapes, configure hooks

Scope format: `<context-uri>#read`, `<context-uri>#write`, `<context-uri>#manage`

No resource-level permissions. No complex policy language. No ACL inheritance.
If you need finer granularity, use derived/synthetic contexts (SPARQL CONSTRUCT
rules that create filtered views).

## OAuth & App Identity

- Apps install per pod (pod-local installation)
- Apps identify via DID (Decentralized Identifier) with cryptographic verification
- OAuth 2.0 + PKCE for token exchange
- Tokens carry context-scoped permissions
- No central app registry — any developer can build and publish an app

## SPARQL Sandbox

The SPARQL endpoint accepts any valid query, but the server rewrites it:

- `FROM` / `FROM NAMED` clauses are intersected with the token's readable contexts
- If no explicit graph is specified, all readable contexts are included
- Write operations (SPARQL Update) are restricted to writable contexts
- Result: full SPARQL power, zero information leakage

## MCP (Model Context Protocol)

Each pod exposes an MCP endpoint. AI agents connect via JSON-RPC and can:

- Query data via SPARQL (sandboxed)
- Discover what data exists (via shapes, once V1 is implemented)
- Read/write resources
- Search semantically (once V5 is implemented)

The same permission model applies — MCP access is scoped by the token's contexts.

## AI Layer

Provider-agnostic AI capabilities:

- **text2model** — natural language → RDF (e.g., "Meeting with Alice tomorrow
  at 3pm" → schema:Event with proper date, attendee)
- **model2model** — RDF → enriched RDF (e.g., extract categories, generate labels)
- **llmLabel** (planned) — per-resource text summary for vector embeddings

The pod owner chooses the provider:
- Ollama (local, private)
- OpenAI / Anthropic (cloud, own API keys)
- AI Horde (decentralized, community-powered)

## Derived/Synthetic Contexts

Instead of resource-level permissions, pod owners create filtered views:

```
/contacts/private           (full data)
    │
    │  SPARQL CONSTRUCT rule: extract friends only, name only
    ▼
/contacts/friends            (synthetic: subset, reduced properties)
```

Synthetic contexts are normal contexts with normal permissions. The SPARQL rule
is an implementation detail. No new concept needed.

## Current Stack

- **Server:** Kotlin, RDF4J, MongoDB
- **Client SDK:** TypeScript (`@sempods/app-sdk`)
- **Apps:** React (Focus, Eventer)
- **Protocol:** HTTP, JSON-LD, SPARQL, OAuth 2.0, MCP (JSON-RPC)
