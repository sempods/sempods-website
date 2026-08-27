---
name: "BC3: Community Knowledge Graph"
description: Community-generated knowledge as living pod service — recipe platforms, Q&A sites, music databases
type: business-case
---

# BC3 — Community Knowledge Graph

**Archetype: Community Knowledge Graph**
A community generates knowledge — sempods becomes a living, growing service.

## The Pattern

A platform with a large community that collectively generates domain knowledge.
The platform's value is not static content but a **living, growing knowledge
graph** that improves through editorial curation, AI-assisted enrichment, and
community contributions.

**Key insight: "A copy doesn't improve. The pod does."**

Users can export their data at any time (open standards, no lock-in). But the
exported copy is frozen. The pod keeps growing. Natural retention without
artificial lock-in.

## Example: Recipe Platform

```
pod.recipes.example
    ├── /recipes/base              (core recipe graph)
    ├── /recipes/nutrition          (calories, allergens)
    ├── /recipes/appliance-X       (device-specific adaptations)
    ├── /knowledge/ingredients      (substitutions, pairings)
    ├── /knowledge/techniques       (cooking techniques)
    ├── /community/adaptations      (user variations)
    ├── /subscriber/alice/ai-memory (personal AI context)
    └── /public/base-recipes        (free: basic data as LOD)
```

**Example queries:**
- "I have potatoes, leeks, and cream — what can I make?" (semantic matching)
- "Make this recipe work for [appliance X]" (appliance context)
- "I'm lactose intolerant, what can I substitute?" (ingredient graph)

## LOD as Business Strategy

The free tier isn't charity — it's ecosystem building:
- Public contexts make the platform the **canonical reference source**
- Third-party apps link to platform URIs — traffic, authority
- Device manufacturers license specific contexts (B2B)
- Premium data stays behind subscription — conversion funnel

## Applies Beyond Recipes

- Music databases (discographies, credits)
- Q&A platforms (structured answers, not text threads)
- Marketplaces (product knowledge, comparisons)
- Sports databases (statistics, results)
- Travel platforms (destinations, local knowledge)
- DIY/Maker communities (projects, materials, tools)

The pattern is always the same: community generates knowledge, platform
structures and enriches it in a pod, subscribers access a living graph,
LOD drives ecosystem.
