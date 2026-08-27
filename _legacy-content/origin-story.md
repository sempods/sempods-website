---
name: Origin Story
description: How and why sempods came to be — from frustration with data silos to a vision for the open web
type: background
---

# The Origin Story

## It started with frustration

Around 2015, Facebook changed their API. Public event data — concerts, exhibitions,
community gatherings — was locked behind walls. Their documentation explicitly stated
that this information was "too valuable" to expose via the API.

Think about that: **public events**, organized by local artists and venues for their
community, declared "too valuable" by a platform that didn't create any of it. The
venues had no alternative. They posted on Facebook because that's where the audience
was. And Facebook owned the data.

## The realization

Artists and small venues have no idea what the internet could actually offer them.
They think "being online" means having a Facebook page. They don't know that their
event data could be structured, linkable, queryable — accessible to any app, any
website, any AI, without depending on a single platform.

This is what Linked Open Data was supposed to enable. But nobody built the tools
to make it accessible for normal people.

## Eventer: the first proof

Eventer was the direct response. A tool where venues manage their events and
publish them as Linked Open Data — structured, publicly accessible, platform-
independent. `schema:Event` resources with real URIs, real JSON-LD, real HTTP.

No lock-in. No platform dependency. The venue's data belongs to the venue.

Today, real venues in Chemnitz use Eventer. Their events are published as Linked
Data from their own pods. An aggregator app (w2d2d) combines events from multiple
pods. A venue's website pulls event data directly from the pod. It works.

## From eventer to sempods

Building Eventer revealed the deeper problem: it's not just events. It's
everything. Photos on Instagram, messages on WhatsApp, tasks in Todoist,
AI conversations in ChatGPT — every service builds its own silo with your data.

The pattern was always the same:
1. You create data
2. A platform stores it
3. The platform owns it
4. You can't leave without losing it

Sempods inverts this pattern. Your pod is your data space. Apps come to your
data, not the other way around. You choose which app, which AI, which person
gets access — and you can change your mind without losing anything.

## The Hojoki connection

This isn't the first attempt. In 2011, Danilo co-founded **Hojoki** — a
semantic-web-based app that aggregated data from 21+ cloud services (Dropbox,
GitHub, Basecamp, Trello, ...) into a unified activity stream. Top 10 App 2011
(ReadWriteWeb), Pioneer Vendor of the Year (Forrester). 300,000+ triple stores
running in production.

Hojoki tried to solve the silo problem from the outside: connect to every
service, pull data together, present a unified view. It worked — but it was
fragile. Every API change broke an integration. Every new service needed a
new adapter. You were still dependent on the silos; you just had a nicer
window into them.

Sempods is the lesson learned: **don't aggregate silos from outside. Build the
right data architecture from the ground up.**

## Why it's free (for now)

Eventer is free for venues during onboarding. Commercial venues pay 5 EUR/month
once they see the value — as a cost contribution, not a business model.

Why? Because the mission is not revenue. The mission is proving that public data
should be public. That a venue in Chemnitz should own their event data just as
much as a venue in Berlin. That the internet should work the way it was designed
to work — open, linked, decentralized.

Revenue is a sustainability question, not a goal.

## The person behind it

Danilo Stein — passionate programmer since 1992. Built Hojoki, worked as a
Staff Engineer, but the private projects have always been more formative than
employment. Over the years, the focus shifted from business ideas to sustainable
ideas for the public good.

Sempods is the synthesis of 30 years of thinking about how data should work.
