---
name: "UC2: AI Memory"
description: Pod as structured, permission-aware memory for AI agents — survives sessions and tools
type: use-case
---

# UC2 — AI Memory

**Your pod as structured memory for AI agents.**

Instead of every AI agent building its own memory silo, the pod serves as shared,
permission-aware memory. Each agent/session gets a write context for its working
memory, plus read access to existing data.

## The problem today

Every AI tool builds its own memory: ChatGPT has its memory, Claude has its
projects, your coding assistant has its context. None of them talk to each other.
When you switch tools, you start over. And you don't control what they remember.

## How sempods solves this

- Each AI session/agent gets its own context with isolated permissions
- Data is structured RDF from day one — queryable via SPARQL, not flat key-value
- Multiple agents can share memory through shared contexts
- The pod owner controls access, not the agent framework
- Memory evolves naturally from unstructured text to semantic facts without migration

## The real power: write + read contexts

The AI gets one context to **write** its own memory (facts, relations, summaries),
plus **read** access to existing contexts with real data (tasks, events, contacts).

The AI can then enrich its own memory by linking to existing resources — creating
new semantic edges between its working memory and your actual data, without
modifying the source. The AI operates on a living knowledge graph, not a flat
conversation log.

## Concrete example

An AI assistant during a multi-session project maintains semantic facts:
- `<application> :status "submitted"`
- `<mirko> :reviewed <application>`
- Links to real pod resources (roadmap entries, contact data)

This persistent understanding survives session boundaries — queryable,
structured, and under your control.

## Why this is better than existing solutions

| Current (Mem0, LangChain Memory, etc.) | Pod-based AI Memory |
|---|---|
| Proprietary format, vendor-locked | Open standards (RDF), portable |
| Flat key-value or text chunks | Structured semantic graph |
| One agent = one memory silo | Shared contexts across agents |
| Agent controls the memory | You control the memory |
| Memory lost when switching tools | Memory survives tool changes |

## Status

Architecturally ready. The write-context + read-contexts pattern works today.
Missing: dedicated "AI memory" app/UI, llmLabel generation, vector search.
