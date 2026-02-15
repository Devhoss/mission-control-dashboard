# OpenClaw Mission Control Dashboard

A premium mission control dashboard for monitoring and operating an **OpenClaw AI Agent System** running 24/7.

This project is designed to act as an **Operator OS** for autonomous agents: real-time system visibility, task approvals, agent inspection, chat transcripts, outbound message queueing, content pipelines, CRM workflows, and knowledge search — all powered by OpenClaw’s filesystem-based memory/state architecture.

---

## ✨ Features

### 🏠 Home Dashboard
Live overview cards with auto-refresh:
- System Health (services UP/DOWN)
- Agent Status (healthy/unhealthy summary)
- Cron Health (job status tracking)
- Revenue Tracker (current revenue, burn, net)
- Content Pipeline (Draft → Published counts)
- Quick Stats overview

Refresh interval: **15 seconds**

---

### 🛠 OPS (Operations Center)
Tabbed command view:
- **Operations**: priorities + observations feed
- **Tasks**: suggested tasks approval/rejection workflow
- **Calendar**: placeholder UI (Convex integration planned)

---

### 🤖 Agents
- Agent registry viewer
- Agent inspection panel (SOUL.md + RULES.md)
- Recent outputs preview from shared context
- Models tab placeholder for future routing system

---

### 💬 Chat Console
- Session list auto-discovered from `.jsonl` transcripts
- Transcript viewer with message bubbles + channel badges
- Session search + channel filtering
- Outbound message sending (writes JSONL queue file)
- Voice input support (Web Speech API)
- Command tab placeholder for future quick controls

---

### 📝 Content Pipeline
Filesystem-first content management:
- Kanban board: Draft / Review / Approved / Published
- Markdown editor modal
- Platform filtering + search

---

### 📡 Comms + CRM
- Comms feed aggregator (Discord/Telegram/system logs)
- CRM kanban pipeline:
  Prospect → Contacted → Meeting → Proposal → Active
- Client markdown viewer modal

---

### 🧠 Knowledge + Ecosystem (Planned)
Upcoming phases include:
- Global workspace file search
- Ecosystem product mapping with detail views

---

### 💻 Code Pipeline (Planned)
Upcoming phases include:
- Git repo scanner
- Branch + commit history
- Dirty file count
- Repo detail view

---

## 🧱 Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **ShadCN UI**
- **Lucide Icons**
- **Framer Motion**

### Backend
- Next.js API routes (`/api/*`) reading OpenClaw workspace files
- Node.js runtime for filesystem access

### Real-time Backend (Future)
- **Convex** (calendar/events/tasks/structured data)

---

## 📂 OpenClaw Workspace Support

Mission Control reads live data from OpenClaw workspaces.

### Environment Variables
Create a `.env.local` in the project root:

```env
OPENCLAW_ROOT_PATH=/root/.openclaw
DEFAULT_WORKSPACE=workspace-winter
For Windows development example:

OPENCLAW_ROOT_PATH=C:/openclaw-dev/.openclaw
DEFAULT_WORKSPACE=workspace-main
Workspace Switching
Workspace is selected via URL query param:

?ws=workspace-main
Example:

/ops?ws=workspace-winter&tab=tasks
🔒 Security Notes
Filesystem access is sandboxed using allowlist rules:

Only reads inside OPENCLAW_ROOT_PATH

Blocks sensitive directories like:

credentials

identity

.ssh

.env

tokens

secrets

All filesystem operations go through safe-fs.ts.

🚀 Getting Started
1) Install Dependencies
npm install
2) Configure Environment
Create .env.local:

OPENCLAW_ROOT_PATH=C:/openclaw-dev/.openclaw
DEFAULT_WORKSPACE=workspace-main
3) Run Development Server
npm run dev
Open:

http://localhost:3000
🧪 Local Testing Data Setup (Optional)
To test features locally without a real OpenClaw system, create a fake workspace folder:

OPENCLAW_ROOT_PATH/
  workspace-main/
    state/
    agents/
    sessions/
    clients/
    content/
Example test file:

workspace-main/sessions/test.jsonl

{"role":"user","content":"Hello","createdAt":"2026-02-15T00:00:00Z","channel":"discord"}
{"role":"assistant","content":"Mission Control online.","createdAt":"2026-02-15T00:00:01Z","channel":"discord"}
📌 Project Roadmap
Completed
✅ Phase 0: UI shell + design system
✅ Phase 1: Workspace switching (?ws=)
✅ Phase 2: HOME dashboard APIs + live cards
✅ Phase 3: OPS page + task approvals
✅ Phase 4: AGENTS viewer + detail panel
✅ Phase 5: CHAT system + outbound queue
✅ Phase 6: CONTENT + COMMS + CRM

Planned
⏳ Phase 7: Knowledge search + Ecosystem mapping
⏳ Phase 8: Code pipeline (repo scanner + git status)
⏳ Phase 9: Convex integration (calendar/tasks/events)
⏳ Phase 10: Automation commands + “Jarvis intelligence” layer

🖥 Deployment (Target)
Production deployment is intended for a Linux VPS where OpenClaw is installed at:

/root/.openclaw
The dashboard will run on the same VPS and read OpenClaw workspaces directly.

👤 Author
Built by Hoss.
