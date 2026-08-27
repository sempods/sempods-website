---
name: Core Knowledge
description: Always-loaded context — enough to answer most questions without loading additional files
type: core
---

# sempods — Core Knowledge

## The One Idea

**Your data should belong to you.**

Today, your photos belong to Instagram, your messages to WhatsApp, your calendar
to Google, your AI conversations to ChatGPT. You are the tenant; the app is the
landlord. If the app shuts down or changes its rules, you lose.

SemPods inverts this. Your pod is your personal memory. Apps and agents come to
your data, not the other way around. You decide who gets access — and you can
change your mind at any time without losing anything.

Every architectural decision in this project flows from this one idea.

## What is a Semantic Pod?

A pod is a self-hostable personal data space. Information is stored as structured,
linked data (RDF) organized in **contexts** (named graphs). Pods are addressable
via HTTP (e.g. `https://sempods.org/alice/...`) and designed to be decentralized:
anyone can host pods, and different implementations are possible as long as they
follow the standard.

**The key insight:** most data platforms start with the API and bolt on
interoperability later. SemPods starts with **semantic interoperability as the
foundation** and builds everything on top. An app that stores tasks as
`schema:PlanAction` is automatically compatible with any other app that
understands `schema:PlanAction` — without integration work or coordination.

## Core Architecture (5 pillars)

1. **Linked Data CRUD** — resources are HTTP URIs, JSON-LD as primary format,
   standard RDF serializations supported
2. **OAuth-based authorization** — apps install per pod, obtain tokens, receive
   URI-based scopes (`<context>#read`, `<context>#write`, `<context>#manage`)
3. **Context-based access control** — every statement belongs to exactly one
   context. Access control = read/write rights on contexts. Simple, universal,
   enforced everywhere.
4. **SPARQL endpoint** — full SPARQL with server-enforced sandbox (queries only
   see contexts the token can read)
5. **Protected system area** — `/_system/*` for control-plane state, not
   modifiable via regular CRUD

## What Exists Today (working code)

- **Pod server** (Kotlin, RDF4J, MongoDB) — full CRUD, SPARQL sandbox, context
  permissions
- **OAuth 2.0 + PKCE** with DID-based app identity verification
- **AI layer** — provider-agnostic text-to-model and model-to-model extraction
  (natural language in, RDF out). Supports Ollama (local), OpenAI, Anthropic.
- **MCP endpoint** per pod — AI agents query pod data via JSON-RPC
- **Client SDK** (`@sempods/app-sdk`, TypeScript) with AppShell pattern
- **Focus app** — task management SPA that installs on any pod, creates tasks
  from natural language, stores them as schema.org/PlanAction
- **Eventer** — event management for venues, real venues use it in production
- **Live Linked Open Data** — e.g. `sempods.org/aaltra/events/...` serves real
  event data as JSON-LD, publicly accessible

## How sempods Differs from Solid

Both pursue the same high-level vision: personal data pods, user sovereignty.
After 8+ years, Solid struggles with complexity. SemPods makes different choices:

| Aspect | Solid | SemPods |
|---|---|---|
| Access control | WAC/ACP (two competing systems) | Contexts + read/write/manage (one simple model) |
| Data organization | LDP containers (complex) | Named graphs / contexts |
| AI integration | None (designed pre-LLM era) | First-class: text2model, MCP, vector search planned |
| App identity | WebID | DID with cryptographic verification |
| Query | Limited SPARQL | Full SPARQL with server-enforced sandbox |

The simplicity is the design. Fewer concepts = fewer edge cases, fewer spec
ambiguities, easier implementation by third parties.

**Important:** Solid and sempods share values. The communities overlap. We don't
compete — we offer a different approach to the same problem. Let people compare
on merit.

## Use Cases (overview)

- **Personal Pod** — one person, one pod, full control. All personal data in one
  place. App switching without data loss.
- **AI Memory** — pod as structured, permission-aware memory for AI agents.
  Multiple agents share knowledge through shared contexts. Memory survives
  sessions and tools.
- **Decentralized Events** — venues publish events as Linked Open Data from their
  own pods. Aggregators combine events from any number of pods.
- **Social Coordination** — friends coordinate plans through shared pod data.
- **Knowledge Publishing** — pods as nodes in a decentralized knowledge graph
  (museums, researchers, cities).
- **Conversational Knowledge** — "ask your AI" as interface to structured knowledge.

## Business Case Archetypes

- **Enterprise Knowledge** — company has data silos, pod becomes AI knowledge
  layer for employees (per-seat SaaS model)
- **Regional/Domain Monopoly** — organization has exclusive domain knowledge,
  pod becomes subscription product (e.g. regional publishers)
- **Community Knowledge Graph** — community generates knowledge, pod becomes
  living, growing service (e.g. recipe platforms, Q&A sites)

## The Vision Roadmap (what comes next)

1. **SHACL as app definition** — shapes define what data a context holds, serve
   as documentation + validation + discovery
2. **Web identity access** — grant context permissions to people (not just apps)
3. **Public contexts + Linked Open Data** with cryptographic signatures
4. **Reactivity** — ChangeStreams, Hooks, PubSub (ActivityPub as transport layer)
5. **Vector search** — semantic search with context sandbox
6. **Enhanced MCP** — shape-aware agent tools, self-discovery
7. **Federation** — pods sync contexts, forming a decentralized network

## Design Principles

- **Copyable** — spec-first, implementation-agnostic. Anyone can build a pod server.
- **Small core + extensions** — the core is minimal and well-defined
- **Deterministic security** — server-enforced, always
- **Interoperability over optimization** — open standards (RDF, SPARQL, JSON-LD, SHACL)
- **Revoke = "no more access"** — honest position. No false promises about
  deleting shared data. The protocol doesn't pretend to control data beyond its
  boundary.
- **AI is provider-agnostic** — pod owner chooses: Ollama (local), cloud APIs
  (own keys), or decentralized (AI Horde)

## Honest Risks

- **Adoption** — Semantic Web has historically not achieved mainstream developer
  adoption. Mitigation: target AI agents (who handle RDF natively) + good SDK.
- **Solo development** — currently one person, part-time. Code quality is high;
  bandwidth is the bottleneck.
- **Timing** — the window is open (MCP is establishing, no dominant solution
  exists), but could close if big tech builds a closed alternative.
- **"The main risk is not the architecture. The main risk is that nobody sees it."**

## Who Built This

Danilo Stein — passionate programmer since 1992. Co-founder and former CTO of
Hojoki (2011-2014), a semantic-web-based app that aggregated 21+ cloud services
(Top 10 App 2011, Pioneer Vendor of the Year by Forrester). Scaled 300k+ triple
stores in production. SemPods is the synthesis: not aggregating silos from
outside, but building the right data architecture from the ground up.
