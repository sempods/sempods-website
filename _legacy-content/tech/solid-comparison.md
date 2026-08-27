---
name: Solid Comparison
description: Detailed comparison between sempods and Solid — architectural choices, trade-offs, and shared values
type: tech
---

# SemPods and Solid — A Comparison

## Shared Vision

Both Solid (Tim Berners-Lee / Inrupt) and sempods pursue the same high-level
vision: personal data pods, user sovereignty, decentralized apps. The communities
share values. This is not a competition — it's a different approach to the same
problem.

## Where They Diverge

After 8+ years of development, Solid has accumulated complexity. SemPods makes
consciously different choices:

### Access Control

**Solid:** Two competing systems — WAC (Web Access Control) and ACP (Access
Control Policy). WAC is simpler but limited; ACP is powerful but complex. The
community is split on which to use. Both operate at the resource level.

**SemPods:** One model — context-based permissions. Three operations: read,
write, manage. Applied per context (named graph), not per resource. If you need
finer granularity, create derived contexts via SPARQL CONSTRUCT rules. The
permission model stays simple; data curation handles granularity.

### Data Organization

**Solid:** LDP (Linked Data Platform) containers — a complex model with
containers, resources, containment triples, and various interaction patterns.

**SemPods:** Named graphs (contexts). Every statement belongs to one context.
No container model, no containment semantics. Simpler, more direct.

### AI / Agent Integration

**Solid:** Designed in the pre-LLM era. No native AI or agent concept. MCP,
vector search, and text-to-model must be bolted on externally.

**SemPods:** AI is first-class. text2model (natural language → RDF), MCP
endpoint per pod, vector search planned, provider-agnostic AI layer. Designed
for the era where AI agents are primary data consumers.

### App Identity

**Solid:** WebID — profile documents served as Linked Data.

**SemPods:** DID (Decentralized Identifier) with cryptographic verification.
App identity is verifiable without trusting a hosting provider.

### Query

**Solid:** Limited SPARQL support varies by implementation. Some support it
fully, others partially or not at all.

**SemPods:** Full SPARQL with server-enforced sandbox. Queries are transparently
filtered by the caller's readable contexts. This is a core feature, not an
afterthought.

## The Simplicity Argument

SemPods has fewer concepts than Solid:

| Concern | Solid | SemPods |
|---|---|---|
| Access control | WAC + ACP | Context permissions |
| Data organization | LDP containers + resources | Contexts (named graphs) |
| Permission granularity | Resource-level ACLs | Derived contexts (SPARQL rules) |
| App discovery | Type indexes, shape trees | SHACL shapes per context |
| Agent integration | External | Built-in (MCP, text2model) |

Fewer concepts = fewer edge cases, fewer spec ambiguities, easier implementation.

## What Solid Does Better (honesty)

- **Community size** — Solid has a larger community, more implementations, more
  academic attention
- **Specification maturity** — Solid's spec process is further along (W3C
  involvement)
- **Inrupt backing** — commercial company with funding and enterprise contracts
- **Interop spec** — Solid's interoperability specification (shape trees, type
  indexes) is more developed

## The Bottom Line

If Solid's complexity is acceptable for your use case, it's a valid choice with
a larger ecosystem. If you want something simpler, AI-native, and willing to
trade ecosystem size for architectural coherence — sempods is worth exploring.

Both projects would benefit if data sovereignty succeeds. We're on the same side.
