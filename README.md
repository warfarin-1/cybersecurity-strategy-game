# Cybersecurity Strategy Game

COMP3003 Undergraduate Project — Yixuan Guo (20513833)
Supervisor: Professor Furnell, University of Nottingham

## Overview

A browser-based educational strategy game that teaches cybersecurity risk management through gameplay. Players act as a security manager, allocating a limited budget to deploy security controls against evolving threats — learning real-world trade-offs between different security investments.

The game draws on two regulatory frameworks:
- **UK NCSC CAF** (Cyber Assessment Framework) — maturity levels 2 / 3 / 4
- **China Deng Bao** (GB/T 25070-2019) — classified protection tiers

## Gameplay

- 11 stages across 3 difficulty tiers (Basic Protection → Critical Business → Key Infrastructure)
- Turn-based: each turn, deploy controls, then simulate attacks
- High-risk unmitigated attacks → game over; lower-risk → score deduction
- Budget limits force prioritisation decisions

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite (rolldown-vite) 7.2.5 |
| Styling | Pure CSS, dark theme |

## Getting Started

```bash
npm install
npm run dev      # development server with HMR
npm run build    # type-check + production build
npm run preview  # preview production build
```

## Status

Prototype stage — navigation system and UI layout complete; game logic under active development.
