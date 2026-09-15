# KRONOS — Personal Life Operating System

> **A high-performance personal operating system combining Smart Scheduling, Task Execution, Habit Streaks, Strategic Goals, and Future Fitness Telemetry.**

Built with **React Native (Expo)**, **TypeScript**, **Expo Router**, **Zustand**, and **Supabase (PostgreSQL + RLS)**.

---

## ⚡ Key Highlights

- **Obsidian & Electric Blue Design System**: Restrained, futuristic dark aesthetic inspired by Apple, Linear, and Strava.
- **Dynamic Task Engine**: Intelligent sorting hierarchy (Overdue $\rightarrow$ Urgent/High Priority $\rightarrow$ Due Time $\rightarrow$ Creation timestamp) with optimistic completion toggles.
- **Habit Consistency & Streak Engine**: Pure algorithm calculating current consecutive streaks, all-time best streaks, 30-day consistency rates, and 7-day visual calendar squares.
- **24-Hour Unified Scheduler**: Normalized calendar view model merging time blocks, scheduled tasks, and daily habits with live Current Time indicator and conflict detection.
- **Strategic Goals & Reminders**: Long-term objectives with customizable units (km, books, %, etc.), $+X$ quick progress logger, linked milestones, and preset reminder offsets.
- **Production Supabase Integration**: End-to-end authentication, session persistence, and encrypted Row-Level Security (RLS) policies.

---

## 🏗️ Architecture & Tech Stack

```
KRONOS Life OS
├── app/                      # Expo Router File-Based Navigation
│   ├── (auth)/               # Authentication Route Group (Login, Signup, Forgot Password)
│   ├── (tabs)/               # Core Bottom Tabs (Dashboard, Schedule, Activity, Profile)
│   └── _layout.tsx           # Root Auth Guard & Global Theme Provider
├── components/
│   ├── navigation/           # Custom Tab Bar & Centered Floating Action Button
│   └── ui/                   # Modular UI Primitives & Interactive Bottom Sheets
├── features/
│   ├── tasks/                # Task Types, Intelligent Sorting, Supabase CRUD
│   ├── habits/               # Habit Types, Streak Engine (calculateHabitStreak), Log Upserts
│   ├── events/               # Event Types, Semantic Color Chips, Supabase CRUD
│   ├── calendar/             # Normalized View Model & Overlap Conflict Partitioning
│   ├── goals/                # Strategic Goals Data Layer & Progress Utilities
│   └── reminders/            # Reminder Offset Engine & Notification Foundation
├── store/                    # Zustand Global Stores (Auth, Life OS, Theme, Toast)
├── supabase/                 # PostgreSQL Schema & Row-Level Security (RLS) Policies
└── constants/                # Typography, Radii, Obsidian Theme Tokens, Mock Data
```

---

## 📱 Core Modules

### 1. Dashboard (Home)
- **Dynamic Progress Ring**: Real-time ratio of completed to total scheduled tasks today.
- **Today's Focus Block**: Automatically resolves the highest priority pending objective or upcoming event.
- **Habit Streak Strip**: Active routines with direct check toggles and detail modals.
- **Next Reminder Notification**: Live countdown banner for the next enabled alert.

### 2. Plan & Schedule (Calendar)
- **Day & Week View Switcher**: 24-hour timeline with horizontal 7-day date selector.
- **Live Current Time Indicator**: Synchronized red indicator line updating every 60 seconds.
- **Conflict Detection Engine**: Highlights concurrent blocks and partitions overlapping items into side-by-side columns.

### 3. Strategic Goals & Analytics (Profile)
- **Milestone Tracker**: Visual progress bars, days remaining countdown, and $+X$ progress logger.
- **Relational Milestones**: Link tasks and habits directly to long-term goals (`Goal` $\leftrightarrow$ `Task` $\leftrightarrow$ `Habit`).
- **User Profile Management**: Live Supabase session display, initials avatar fallback, and Theme Switcher (Dark, Light, System).

### 4. AI Mission Control (Analyze)
- **AI Daily Mission Briefing**: Personalized executive briefing grounded strictly in actual tasks, calendar events, habit risks, fitness telemetry, and strategic goals.
- **Cross-Domain & Domain Insights**: Heuristic and predictive intelligence identifying task postponement velocity, workout-workload collisions, and habit streak preservation.
- **Controlled Function / Tool Calling Layer**: 15+ typed tools executing against domain services (`create_task`, `complete_task`, `delete_task`, `create_event`, `log_habit`, `find_free_time`, etc.).
- **Confirmation Safety Guard**: Destructive actions (task/event/goal deletions, bulk schedule moves) require explicit interactive user authorization.
- **Proactive Schedule Optimizer**: Detects tight transitions and concurrent schedule collisions, proposing actionable non-destructive calendar shifts.
- **Conversational Mission Control Interface**: Mobile-first conversational modal with suggested prompts, markdown formatting, tool execution badges, and retry states.
- **Zero Client Secrets & Deterministic Fallback**: Provider-agnostic architecture supporting remote Edge Functions with built-in deterministic cognition for 100% offline & Demo Sandbox resilience.
- **Persistent AI Conversations**: User-scoped history stored in `public.ai_conversations` with PostgreSQL RLS policies.

---

## 🔐 Database Schema & Security

All tables in PostgreSQL enforce strict **Row-Level Security (RLS)**:
```sql
-- All operations restricted to authenticated session owner
CREATE POLICY "Users can manage own tasks" ON public.tasks 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON public.goals 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo Go App or Web Browser

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/priyanshu-kuntal/KRONOS-life-os.git
cd KRONOS-life-os

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
*(If no credentials are provided, KRONOS automatically operates in offline Demo Sandbox mode).*

### 4. Running Locally
```bash
# Start development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Build for web
npx expo export -p web
```

---

## 📋 Development Roadmap

- [x] **Phase 1**: Design System & Modular UI Primitives (Obsidian + Electric Blue)
- [x] **Phase 2A**: Production Supabase Authentication & User Profiles
- [x] **Phase 2B**: Production Tasks & Habit Streak Engine
- [x] **Phase 2C**: 24-Hour Calendar, Scheduler & Conflict Layout Engine
- [x] **Phase 2D**: Strategic Goals, Progress Logger & Reminders
- [x] **Phase 3**: GPS Fitness Telemetry & Route Tracking (Running / Cycling / Walking / Hiking)
- [ ] **Phase 4**: Mission Control AI Proactive Planner & Intelligent Rescheduling

---

## 🏃 Phase 3: TRACK Architecture

- **Hardware GPS & Filtering**: Foreground GPS tracking using `expo-location` with high-accuracy navigation settings, filtering invalid speed spikes and stationary jitter.
- **Geodesic Math**: Precise Haversine distance calculations, real-time pace ($min/km$), and MET-based caloric expenditure formulas.
- **Live Workout HUD**: Stopwatch timer, live distance, current pace, average pace, cumulative elevation gain, and GPS signal lock indicator.
- **Precision Vector Route Map**: Geographic bounding-box SVG projection rendering route polylines, start pins, and live position pulses across Web, iOS, and Android without external tile dependencies.
- **Supabase Persistence**: Complete CRUD in `activityService.ts` with batched persistence of raw GPS breadcrumbs into `public.activity_points`.
- **Demo & Simulated Route Fallback**: Built-in simulated GPS loop allowing offline testing in browser/sandbox environments.

---

## 📄 License
MIT License. Crafted for high-agency productivity and disciplined life execution.
