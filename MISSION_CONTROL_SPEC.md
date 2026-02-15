# OpenClaw Mission Control — System Specification

## Purpose
This project is a premium mission control dashboard for monitoring and operating an OpenClaw AI agent system.

The agent runs 24/7 on a server, connected to Telegram/Discord, executing cron jobs, spawning sub-agents, and reading/writing to a filesystem-based memory/state system.

Mission Control provides:
- Real-time operational visibility
- Agent inspection (SOUL / RULES / outputs)
- Chat transcript viewing + outbound message queue
- Task approvals + workflow pipeline
- Content pipeline + editing
- Comms feed + CRM pipeline
- Knowledge search across memory files
- Ecosystem product mapping
- Code pipeline visibility (repos + git status)

This is an **operator OS**, not a simple admin panel.

---

## Tech Stack (Mandatory)
- Next.js 15 (App Router)
- TypeScript everywhere
- Tailwind CSS v4
- ShadCN UI
- Lucide Icons
- Framer Motion
- Dark mode only

Backend data sources:
1. **Filesystem API routes** (`/api/*`) reading OpenClaw workspace files.
2. **Convex** (future phase) for structured data and real-time collaboration.

---

## Design System (Strict Rules)

### General Style
- Dark mode only.
- Premium, minimal, clean.
- Avoid visual clutter.
- Avoid heavy gradients, neon glow, or “sci-fi UI noise”.
- More whitespace, less decoration.

### Glass Cards (Standard)
All cards should use consistent styling:

- `bg-white/[0.03]`
- `backdrop-blur-xl`
- `border border-white/[0.06]`
- border radius: `16px–20px`

### Typography
- Use Inter or system stack.
- Body text should be small (10–14px).
- Dense but readable, Bloomberg-terminal style.

### Motion Rules
- Framer Motion page transitions.
- Stagger animations on grids (`0.05s` per item).
- Smooth spring physics for interactions.
- No excessive motion.

### UI Rules
- Skeleton loading states for all async fetches.
- Helpful empty states.
- Custom scrollbar styling.
- Never mix sharp and rounded corners in the same view.

---

## Navigation
- Top horizontal navigation bar (NOT sidebar).
- All 8 nav items visible at all viewport widths.
- Use `flex` layout with `flex-1` nav items.
- Active item uses: `text-primary bg-primary/[0.06]`
- Fluid scaling font size:
  `clamp(0.45rem, 0.75vw, 0.6875rem)`

Nav items:
1. HOME (`/`)
2. OPS (`/ops`)
3. AGENTS (`/agents`)
4. CHAT (`/chat`)
5. CONTENT (`/content`)
6. COMMS (`/comms`)
7. KNOWLEDGE (`/knowledge`)
8. CODE (`/code`)

---

## Workspace System (Critical)

### Environment Variables
Mission Control reads OpenClaw data from a root directory:

```env
OPENCLAW_ROOT_PATH=/root/.openclaw
DEFAULT_WORKSPACE=workspace-winter

Workspace URL Param

All pages and API routes must support:

?ws=workspace-name

Example:
/ops?ws=workspace-winter

Workspace Switching

Workspace dropdown is in the top nav.

Switching workspace updates URL via router.replace (no full reload).

All nav links preserve ?ws= automatically.

Tabs System (Critical)

Tabbed pages store tab state in URL:

?tab=

Example:
/ops?ws=workspace-winter&tab=tasks

TabBar component must:

preserve existing query params (especially ws)

update tab via router.replace

use Framer Motion layoutId for active indicator

Security Rules (Filesystem Access)

All filesystem reads must:

stay inside OPENCLAW_ROOT_PATH

stay inside the resolved workspace folder

Blocked segments:

credentials

identity

.ssh

.env

tokens

secrets

All file reads/writes must go through safe-fs.ts.

All API routes must set:

export const runtime = "nodejs";

Backend Data Model Philosophy

Filesystem data is treated as source-of-truth for operational state.

Convex is added later for:

calendar

tasks table

contacts

structured activity logs

real-time collaboration

Pages Specification
1) HOME (/)

Overview dashboard grid.

Data sources:

/api/system-state

/api/agents

/api/cron-health

/api/revenue

/api/content-pipeline

Cards:

System Health

Agent Status

Cron Health

Revenue Tracker

Content Pipeline

Quick Stats

Auto-refresh:

every 15 seconds

show LIVE dot + "AUTO 15S" badge

2) OPS (/ops)

Tabs:

operations

tasks

calendar

Operations tab

Panels:

Priorities (from /api/priorities)

Observations feed (from /api/observations)

Tasks tab

Suggested tasks approval system:

/api/suggested-tasks GET/POST

approve/reject updates JSON file

filter bar: status + category + search

Calendar tab

Placeholder UI until Convex integration.

3) AGENTS (/agents)

Tabs:

agents

models

Agents tab

/api/agents list

clickable agent cards

detail viewer fetches /api/agents/[id]

show SOUL.md + RULES.md + outputs previews

Models tab

premium placeholder table until routing integration

4) CHAT (/chat)

Tabs:

chat

command

Chat tab:

session sidebar from /api/chat-history

transcript viewer from /api/chat-session

send message via /api/chat-send

outbound queue written to:
delivery-queue/outbound-messages.jsonl

Features:

session search + channel filter

bubbles (user right, assistant left)

system messages centered

auto refresh sessions 15s

auto refresh messages 10s when open

voice input (Web Speech API)

Command tab:

premium placeholder UI for future commands

5) CONTENT (/content)

Filesystem-first content pipeline.

APIs:

/api/content-drafts

/api/content-draft GET/POST

UI:

Kanban columns:
Draft / Review / Approved / Published

Card editor modal (markdown textarea)

search + platform filter

Auto refresh: 30s.

6) COMMS (/comms)

Tabs:

comms

crm

Comms tab:

/api/comms-feed

normalized feed from telegram/discord/system logs

CRM tab:

/api/clients

Kanban pipeline:
Prospect → Contacted → Meeting → Proposal → Active

modal preview using /api/client

Auto refresh:

comms feed: 15s

clients: 30s

7) KNOWLEDGE (/knowledge)

Tabs:

knowledge

ecosystem

Knowledge tab:

global search via /api/knowledge

file viewer via /api/file

debounced search input

split layout (results list + preview)

Ecosystem tab:

product grid using /api/ecosystem

8) ECOSYSTEM (/ecosystem + /ecosystem/[slug])

Grid:

list of products with status badge

Detail:

internal TabBar:
overview / brand / community / content / legal / product / website / actions

reads from /api/ecosystem/[slug]

9) CODE (/code)

Repo scanning + git status.

API:

/api/repos

/api/repos/detail

UI:

repo grid

branch

last commit

dirty file count

language breakdown

repo detail view: commits, file tree, PR placeholders

API Routes (Current / Planned)
Implemented

/api/workspaces

/api/system-state

/api/cron-health

/api/revenue

/api/content-pipeline

/api/agents

/api/agents/[id]

/api/observations

/api/priorities

/api/suggested-tasks

/api/chat-history

/api/chat-session

/api/chat-send

/api/content-drafts

/api/content-draft

/api/comms-feed

/api/clients

/api/client

Upcoming

/api/knowledge

/api/file

/api/ecosystem

/api/ecosystem/[slug]

/api/repos

/api/repos/detail

All routes must support ?ws=.

File Structure (App Layout)
src/
  app/
    layout.tsx
    providers.tsx
    page.tsx

    ops/page.tsx
    agents/page.tsx
    chat/page.tsx
    content/page.tsx
    comms/page.tsx
    knowledge/page.tsx
    ecosystem/page.tsx
    ecosystem/[slug]/page.tsx
    code/page.tsx

    api/...

  components/
    nav.tsx
    tab-bar.tsx
    workspace-switcher.tsx

    dashboard-overview.tsx
    ops-view.tsx
    suggested-tasks-view.tsx

    agents-view.tsx
    models-view.tsx

    chat-center-view.tsx
    chat-command-view.tsx
    voice-input.tsx

    content-view.tsx
    comms-view.tsx
    crm-view.tsx

    markdown.tsx

  hooks/
    use-workspace.ts
    use-query-state.ts
    use-auto-refresh.ts

  lib/
    workspace-path.ts
    safe-fs.ts
    api-response.ts

Development Rules

No breaking changes to existing endpoints.

No breaking changes to workspace query param behavior.

Prefer incremental improvements, not rewrites.

Always ensure npm run build passes.

Deployment Target

The production environment will run on a Linux VPS with OpenClaw installed at:

/root/.openclaw

This dashboard will be deployed on the same server and will read from OpenClaw workspaces directly.