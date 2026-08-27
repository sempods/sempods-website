---
name: "BC1: Enterprise AI Knowledge Layer"
description: Company data silos transformed into semantic knowledge graph — AI assistant with real permissions
type: business-case
---

# BC1 — Enterprise AI Knowledge Layer

**Archetype: Enterprise Knowledge**
A company has data silos — sempods becomes the AI knowledge layer for employees.

## The Problem

Large companies operating employee platforms want AI assistants that "know" the
company. But company knowledge is scattered across legacy services — CMS, HR,
wikis, project tools — each with its own database, no semantic links between them,
and complex permission models.

RAG over unstructured documents is the common workaround, but it lacks precision,
structure, and granular access control.

## The Solution: One Pod Per Customer

```
pod.customer.com
    ├── /company/news          (read-only, from CMS)
    ├── /company/policies      (read-only, from Wiki)
    ├── /company/people        (read-only, from HR)
    ├── /dept/engineering/wiki (read/write, department knowledge)
    ├── /role/management       (read, management-only)
    ├── /employee/alice/ai-memory  (read/write, personal AI context)
    └── /public/careers        (public, job postings as LOD)
```

Legacy data is imported read-only into contexts (semantically enriched, IDs
converted to URIs). Each employee gets a personal AI-memory context. The AI
sees only what the employee is authorized to see — permissions via contexts,
not complex legacy mapping.

## Why This Is Better

| RAG on Documents | Pod-based Knowledge Layer |
|---|---|
| Unstructured document chunks | Structured semantic knowledge graph |
| No real permission model for AI | Context-based permissions, role-mapped |
| Each query re-discovers from scratch | AI builds persistent memory per employee |
| No links between systems | URIs create cross-system connections |
| Vendor lock-in | Open standards, portable |

## Revenue Model

Per-employee seat (monthly) — the existing enterprise SaaS model. The pod-based
AI knowledge layer is a premium tier.
