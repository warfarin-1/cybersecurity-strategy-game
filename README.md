# Cybersecurity Strategy Game

**COMP3003 Undergraduate Project** — Yixuan Guo (20513833)
Supervisor: Professor Furnell, University of Nottingham

---

## What is this?

A browser-based educational strategy game about cybersecurity risk management. Players take the role of a security consultant, working through three progressively harder client engagements — each modelled on a real compliance tier.

The game is designed to teach how security controls map to specific threat types, why budget forces trade-offs, and how risk escalates when controls are left undeployed.

It draws on two regulatory frameworks:
- **UK NCSC CAF** (Cyber Assessment Framework) — maturity levels 2, 3, 4
- **China GB/T 22239 / Deng Bao** — classified protection tiers 2, 3, 4

---

## How to play (quick start)

The live version is deployed at: **[insert Vercel URL]**

No installation needed — open the link and press **Begin**.

### For testers

1. The game starts with a short intro animation — press **Skip** to jump straight to the map.
2. Select a **difficulty mode** (Beginner / Expert) on the map screen. Beginner shows hints; Expert hides them.
3. Language can be switched between **English** and **中文** at any time.
4. Work through all 11 stages across 3 levels to reach the ending.

### Suggested test path

| What to check | How |
|---|---|
| Full playthrough | Complete all stages in order: Level 2 → 3 → 4 |
| Promotion cutscenes | Triggered automatically when a level is completed for the first time |
| Ending animation | Triggered on the map screen after all 3 levels are complete |
| Glossary | Click the 📖 button on any screen |
| Bilingual mode | Switch to 中文 mid-game — UI and data should update immediately |
| Beginner hints | Set mode to Beginner; recommended controls are starred, hints appear in the threat panel |
| Budget pressure | Try deploying every control — the budget runs out before you can cover everything |
| Undo / Reset | Deployed controls can be undone (refunds cost); stages can be fully reset from the chapter screen |

---

## Structure

```
11 stages across 3 levels:

Level 2 — Basic Protection        (client: Singularity, retail)
  L2-1  Phishing Basics
  L2-2  Identity & Access
  L2-3  Data Handling
  L2-4  Network Hygiene

Level 3 — Critical Business       (client: Polarized Light, healthcare)
  L3-1  Targeted Phishing
  L3-2  Cloud Identity
  L3-3  Data at Scale
  L3-4  Network Exposure

Level 4 — Key Infrastructure      (client: Convolutional Kernel, restricted)
  L4-1  High-Risk Identity Chain
  L4-2  Large Data Exposure
  L4-3  Critical Service Compromise
```

Level 4 uses a **threat tree** mechanic — attacks are chained, and the whole chain must be broken to pass.

---

## Running locally

```bash
npm install
npm run dev       # development server (localhost:5173)
npm run build     # type-check + production build
npm run preview   # preview the production build locally
```

Requires Node.js 18+.

---

## Tech stack

| | |
|---|---|
| Framework | React 19 + TypeScript (strict mode) |
| Build tool | Vite 7 |
| Styling | Plain CSS, dark theme |
| Data | CSV + JSON files in `public/data/` |
| Deployment | Vercel |
