# Stride — AI Training Companion

A high-fidelity mobile app prototype for a personal-training app built around an **AI coach** that plans, adapts, and guides your workouts. The prototype runs as a React app rendered inside an iOS/Android device frame.

## What it does

Stride turns a structured training plan into a daily, guided experience. The AI coach knows your goals, injuries, equipment, and where you train, then generates and adjusts sessions for you — and walks you through them set by set.

## Core areas

### Home
Your daily landing screen: today's session as a bold hero card, a daily energy check-in, goals on track, and recent activity. When today's training is finished, the hero switches to a **celebratory "done" state** with a motivational message and an option to add a bonus session.

### Train (active session)
The heart of the app — a focused, full-screen session player with two modes:
- **Managed** — a timed, coach-led flow. Big rep/kg steppers, a sets timeline (warm-ups, working sets with reps × kg, AMRAP), a rest screen with ±15s controls and undo, and a one-tap "Set complete" with a back button to fix mis-taps.
- **Step through** — manual logging with prev/next navigation.

During a session you can open an **exercise-details slideover** (muscles involved, equipment, coach note, today's sets) and a **coach chat slideover** to adjust the session on the fly (increase volume, go lighter, add a set, swap a movement). Finishing a session leads to a recap summary.

### Library
A nested, browsable catalogue of exercises grouped by strength, calisthenics, conditioning, cardio, and mobility. Each exercise has a detail view with a form video (tap to play fullscreen), an "at a glance" spec (muscles involved, equipment, difficulty), form cues, common mistakes, related variations that link to one another, and your history. Users can favourite, hide, filter, and request new exercises.

### Spots
Your training locations (home gym, commercial gym, park, etc.). Each spot can have an **optional photo**, a type, available equipment, and notes. **Official/verified spots** carry a blue verified seal and can be added from a curated directory; custom spots can be submitted for review.

### Equipment
Global equipment preferences — mark what you like and what to avoid; it applies across every spot and generated session.

### Plan & progress
- **Plan** — periodised training blocks (foundations → hypertrophy → strength → peak → test week) and the weekly schedule.
- **Goals** — tracked targets with progress rings.
- **Injuries** — log and monitor niggles so the coach programs around them.
- **Weight** — bodyweight history and trends.

### AI Coach
A conversational coach with selectable **personalities** (Coach, Trainer, Analyst, Riley) that change tone. It seeds and adapts your sessions and explains the "why" behind plan changes.

## Design system
- **Type:** Archivo (display / headings) + Inter (body), with JetBrains Mono for small numeric labels.
- **Palette:** warm near-black ink on a soft warm paper background, a Strava-style coral accent, and a lime "volt" highlight for today/active states; supporting blue, green, amber, and rose.
- **Feel:** athletic, confident, high-contrast. Dark cards for hero/active moments, light surfaces elsewhere.

## File structure
| File | Purpose |
|------|---------|
| `Workout App.html` | App entry — loads React, frames, and all screen modules |
| `app.jsx` | Root: routing, persona state, screen orchestration |
| `data.jsx` | All mock data, theme tokens, and helpers |
| `ui.jsx` | Shared UI kit (icons, buttons, chips, cards, charts) |
| `screens-main.jsx` | Home, Plan, Weight, Profile, AI Coach, shared Sheet |
| `screens-train.jsx` | Generate, active session, summary, chat |
| `screens-meta.jsx` | Library, Goals, Injuries |
| `screens-spots.jsx` | Spots manager, equipment manager |
| `ios-frame.jsx` / `android-frame.jsx` | Device bezels |
| `tweaks-panel.jsx` | In-app tweak controls (device frame, accent, persona) |

> This is a design prototype: data is mocked and persisted locally (localStorage). No backend.
