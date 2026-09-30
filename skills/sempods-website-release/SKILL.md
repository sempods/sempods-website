---
name: sempods-website-release
description: Assess or update the sempods project website after an implementation or specification release, including changes in direction, editorial flow, examples and installation guidance. Use for sempods website release upkeep; preparing an assessment does not publish the site or release software.
---

# sempods website release

Use the website checkout selected for the task. If the task starts in sempods-kotlin or
sempods-spec, locate the sempods-website checkout in the supplied workspace roots. Resolve its
repository root and read `AGENTS.md`, then `docs/agents/release-website.md` from that root.
The repository procedure owns source selection, the content inventory and editorial checks.

With no requested mode, assess. Preparing a guideline or assessment does not authorize a site
rewrite. An explicit website-update request includes local implementation and verification.
Publish only when requested, through the site's existing deployment workflow.

Select the requested implementation release tag, the website's previous reviewed baseline and
an explicit specification revision independently. Never take the next development snapshot as
the released API or a proposed specification change as an available feature. If a source is
missing, report the bounded uncertainty and continue with the supported parts of the assessment.

Run the procedure's inventory helper when present, then review all pages and the complete reader
journey. The helper collects candidates; it cannot verify claims, executable examples or prose.
Return the source record, scope/redesign decision, concrete page changes, checks and remaining
gaps. Link the resulting assessment or patch. Follow the user's language in the response and
the website's language in its content.

If the selected website checkout lacks the procedure, report the missing prerequisite and
identify the intended checkout before applying changes. Do not reconstruct a conflicting copy
of the workflow in this skill.
