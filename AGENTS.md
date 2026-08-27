# sempods.org Website

## Project Overview

Landing page + AI chat for sempods.org. First iteration: **chat-only UI** —
no rendered content pages yet, just the conversational interface.

## Tech Stack

- **Framework:** Next.js (App Router)
- **AI Chat:** Vercel AI SDK with streaming
- **LLM Provider:** Anthropic (Claude) — API key via environment variable
- **Styling:** TBD (keep it clean, minimal, not generic-AI-looking)
- **Deployment:** Netlify

## Architecture: Content-as-Source

The chat is powered by markdown files in `content/`. These files are the
**single source of truth** — they will later also be rendered as web pages.

### How the chat works

Three layers of context, loaded progressively:

1. **Always loaded** (~4-5k tokens):
   - `content/system-prompt.md` — personality, tone, behavioral rules
   - `content/sempods-core.md` — condensed knowledge base (enough for most questions)
   - `content/index.md` — directory of all content files with descriptions

2. **Loaded on demand** (per question, 1-3 files):
   - The LLM reads `index.md` and decides which files are relevant
   - Uses tool use / function calling to load specific content files
   - Example: visitor asks about Solid → LLM loads `tech/solid-comparison.md`

3. **Creative extrapolation** (no file needed):
   - For domains without a pre-written use case, the LLM derives scenarios
   - from the principles in `sempods-core.md`
   - The system prompt explicitly coaches this behavior

### Content file format

```markdown
---
name: Human-readable title
description: One-line description (used by the LLM to judge relevance)
type: use-case | business-case | tech | background | system | core | index
---

# Content here (markdown)
```

### Adding new content

1. Create a `.md` file in the appropriate `content/` subdirectory
2. Add a one-line entry to `content/index.md`
3. Done — the chat automatically discovers and uses it

## First Iteration Scope

- [ ] Next.js project setup
- [ ] Chat UI component (full-screen, centered, streaming responses)
- [ ] API route that sends system-prompt + core + index as context
- [ ] Tool/function for loading additional content files on demand
- [ ] Rate limiting per IP (prevent API cost abuse)
- [ ] Minimal landing: hero text + chat — nothing else needed yet
- [ ] Environment: `ANTHROPIC_API_KEY`

## Design Direction

- Clean, minimal, confident — not a typical chatbot widget
- The chat IS the website (first iteration)
- Hero text above the chat: "Your data should belong to you."
- Subtext: "Ask me anything about sempods."
- Dark/light mode: follow system preference
- Mobile-friendly

## What NOT to build yet

- Content page rendering (Phase 2)
- User accounts or sessions
- Chat history persistence
- Multiple chat threads
- Analytics

## Content Sync

The `content/` directory is maintained in the eventer-backend repo
(`sempods/website/content/`). For now, copy it into this repo. Later,
automate via build script or submodule.

## Key Context for the AI Chat

The chatbot should feel like talking to someone who deeply understands
and believes in the project — but is also honest about risks and limitations.
Read `content/system-prompt.md` carefully; it defines the personality.

The project creator is Danilo Stein, based in Chemnitz, Germany. The project
is bilingual (German + English), and the chat should respond in the visitor's
language.
