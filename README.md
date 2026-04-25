# AeonGuard Decision Control Centre
### 永卫系统 · The Wandering Earth

> A speculative AI decision support system set in the world of Liu Cixin's *The Wandering Earth* — managing 127 hibernating specialists across a 2,500-year interstellar journey to Proxima Centauri.

**GENS4015 · Science Fiction and the Human Condition · UNSW Sydney 2026**

---

## Live Demo

🌐 **[aeon-guard-iota.vercel.app](https://aeon-guard-iota.vercel.app)**

### Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Administrator | `ADMIN_01` | `earth2500` |
| Operator | `OPERATOR_01` | `wandering847` |
| Engineer | `ENGINEER_01` | `engine2058` |
| Guest | `GUEST` | `guest123` |

---

## Project Overview

AeonGuard simulates a command centre responsible for keeping humanity alive during a multigenerational voyage through deep space. The system integrates real-time biological monitoring, environmental hazard detection, AI-driven specialist allocation, and human-in-the-loop decision making — all visualised through an immersive sci-fi interface.

The project explores four research questions drawn from the novel:
1. How should the system monitor hibernating specialists' life signs in real time?
2. How does AeonGuard detect and respond to environmental habitability risks?
3. What priorities should govern waking dormant specialists during a crisis?
4. How can the system ensure administrators make informed decisions when overriding AI recommendations?

---

## Core Modules

### C1 — Pod Monitoring System · 休眠舱监控
- Grid view of all 127 hibernation pods with real-time status
- Filter by NOMINAL / WARNING / CRITICAL / WAKING / AWAKE
- Per-pod detail panel: heart rate, temperature, metabolic rate, 24h trend chart
- Full wake lifecycle: `WARNING/CRITICAL → VIEW AI ANALYSIS → WAKING → CONFIRM AWAKE → NOMINAL`
- Animated ECG displays and hibernation pod visuals

### C2 — Habitat Alert System · 环境警报
- Monitors O₂, radiation, and pressure across four underground city layers (B1–B4)
- 3D GLB city models per floor — residential, industrial, energy, and procedurally generated reactor core
- Real-time semicircle gauges, 60-minute trend charts, and environment heatmap
- Clickable ventilation system cards with BOOST and maintenance actions
- Predictive analysis with expandable forecast cards
- Crisis trigger: random crisis type each time, full-page red alert, siren sound via Web Audio API
- Emergency evacuation protocol with animated SVG floor plan and P1–P4 team dispatch
- Crisis resolves automatically when C4 accepts the AI recommendation

### C3 — AI Reasoning Engine · 推理引擎
- Auto-activates when triggered from C1 (WARNING/CRITICAL pod) or C2 (environment crisis)
- Terminal-style typewriter animation showing five-step reasoning process
- Three-dimension evaluation framework: Biological Health (35%) · Skill Match (40%) · National Rotation Equity (25%)
- Hybrid evolved language used throughout AI output (e.g. `BIO-评分`, `SKILL-匹配度`, `EQUITY-公平指数`)
- Automatically forwards recommendation to C4 decision queue on completion
- Reasoning history accumulates across sessions

### C4 — Human Override Interface · 人工决策
- Pending decision queue populated from C3 recommendations only — starts empty
- Per-decision detail panel: crisis info, three scoring bars, composite score
- ACCEPT: sets recommended pod to WAKING in C1, resolves crisis in C2
- OVERRIDE: requires scrolling through complete risk assessment before confirm button activates; pod returns to original WARNING/CRITICAL state
- Decision statistics accumulate across sessions: accept rate, override rate, pie chart, crisis type breakdown

### C5 — LINGUA · 三语词典
- Draggable floating widget accessible on every page
- Three-layer language dictionary:
  - **Layer 1** — Original Mandarin (emergency alerts, hardcoded by founding engineers)
  - **Layer 2** — Standard English (modern governance interface)
  - **Layer 3** — Hybrid Evolved Language (AI-internal, centuries of automated fusion)
- Searchable and filterable by category: ENV · CRYO · EMG · SYS · STATUS · MISSION · CREW

---

## Cross-Page Interaction Flow

```
C1 WARNING/CRITICAL pod
    → Click VIEW AI ANALYSIS
    ↓
C3 auto-starts reasoning animation
    → Evaluates pod occupant against crisis type
    → Saves decision to localStorage
    ↓
C4 receives new PENDING decision
    → ACCEPT → C1 pod becomes WAKING → user confirms AWAKE → NOMINAL
    → OVERRIDE → C1 pod returns to WARNING/CRITICAL (can re-trigger)
    ↓
C2 crisis → VIEW AI ANALYSIS
    → C3 recommends NOMINAL specialist based on crisis type
    → C4 accept → crisis banner resolves in C2
```

---

## Language Design

The interface uses a deliberate three-layer linguistic structure:

- **English** — most of the UI, reflecting centuries of unified international governance
- **Hybrid language** — AI terminals and system logs, a natural fusion of English and Mandarin that evolved through automated processing (e.g. `O₂-气体 CRIT-危急状态`, `CRYO-舱位 NOMINAL-态`)
- **Mandarin only** — emergency alerts, hardcoded by the original Chinese engineers and never modified — a *linguistic fossil* of Earth's origins

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Framework | React 18 + TypeScript + Vite + React Router v6 |
| 3D Rendering | Three.js (r128), GLTFLoader, CSS2DRenderer, GLSL Shaders |
| Data Visualisation | Recharts, custom SVG gauges and diagrams |
| Animation | CSS Keyframes, Canvas API + requestAnimationFrame |
| Audio | Web Audio API (synthesised, no external files) |
| State | React hooks + localStorage (no backend) |
| Deployment | GitHub + Vercel (auto-deploy) |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/lnkloveating/AeonGuard.git
cd AeonGuard

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Project Structure

```
src/
├── components/
│   ├── EarthScene.tsx       # Three.js 3D Earth with day/night shader
│   └── LinguaWidget.tsx     # Draggable three-layer language dictionary
├── pages/
│   ├── HomePage.tsx         # Main dashboard with 3D Earth and mission stats
│   ├── PodsPage.tsx         # C1 — Hibernation pod monitoring
│   ├── HabitatPage.tsx      # C2 — Environmental alert system
│   ├── AIEnginePage.tsx     # C3 — AI reasoning engine
│   ├── OverridePage.tsx     # C4 — Human override interface
│   ├── MissionPage.tsx      # Mission log and progress
│   ├── CrewPage.tsx         # Crew roster
│   ├── SysLogPage.tsx       # System log with live entries
│   └── SettingsPage.tsx     # Account and logout
├── App.tsx                  # Routing and authentication
public/
├── imgs/                    # 8K Earth textures
└── models/                  # GLB city models (r1, r2, i1, i2)
```

---

## Academic Context

This project was developed for GENS4015 (Science Fiction and the Human Condition) at UNSW Sydney. It explores themes of posthumanism, technological governance, metabolic suppression, human-AI collaboration, and cultural memory through an interactive speculative design artefact based on Liu Cixin's *The Wandering Earth* (流浪地球).

---

*UNSW Sydney · 2026*