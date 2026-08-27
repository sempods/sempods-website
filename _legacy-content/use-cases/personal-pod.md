---
name: "UC1: Personal Pod"
description: One person, one pod, full control — personal data space with app-agnostic storage
type: use-case
---

# UC1 — Personal Pod

**One person, one pod, full control.**

A person hosts (or uses a hosted) pod as their personal data space. Apps install
on the pod and store data in contexts. The pod owner decides which app gets access
to which data.

## What it enables

- All personal data in one place (tasks, calendar, contacts, notes, bookmarks, ...)
- App switching without data loss — new app reads existing data because semantics
  are defined by shared ontologies (e.g. schema.org), not by app-specific schemas
- AI assistants that see the full picture (cross-context queries)
- Sharing selected contexts with friends, family, colleagues

## How it works

```
your-pod.example.com
    ├── /apps/focus/tasks      (tasks, schema:PlanAction)
    ├── /apps/eventer/events   (events, schema:Event)
    ├── /apps/contacts/people  (contacts, schema:Person)
    ├── /personal/notes        (free-form notes)
    └── /shared/family-calendar (shared with family members)
```

Each app gets its own context(s). But because data is RDF with standard
ontologies, a different task app can read Focus's tasks. A calendar app can
read Eventer's events. The data belongs to you, not to the app.

## What exists today

Danilo's personal pod (`sempods.org/danilo`) with Focus (tasks) and Eventer
(events). w2d2d aggregates events from multiple personal pods — the first
real multi-pod application.

## The key difference

In today's world: you install an app, the app creates a database, your data
lives there. Switch apps = start over.

In sempods: you have a pod, you install an app, the app works with your data.
Switch apps = same data, different interface.
