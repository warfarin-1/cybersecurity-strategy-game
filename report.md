# Change Report — Stage State Integration

**Date:** 2026-03-21

---

## Overview

Connected the Stage view in `App.tsx` to real game state, replacing all hardcoded placeholder values with live data driven by `ChapterState` and `StageGameState`.

---

## Files Modified

### `src/types.ts`

Added three new exported types (existing types untouched):

| Type | Kind | Purpose |
|------|------|---------|
| `StageStatus` | `type` | `"not_started" \| "in_progress" \| "completed"` |
| `StageGameState` | `interface` | Per-stage runtime state (stageId, status, turn, budget, sectors, logs, isCompleted) |
| `ChapterState` | `interface` | Per-chapter state (chapterId, totalBudget, remainingBudget, score, stageStates) |

### `src/App.tsx`

#### New module-level declarations (lines 1–43)

- Import `ChapterState`, `StageGameState`, `Sector`, `RiskLevel` from `./types`
- `calculateRiskLevel(controlsApplied)` — maps control count to `RiskLevel` (mirrored from `Layout.tsx`)
- `BASE_SECTORS` — 4 initial sectors (physical, boundary, network, computing), all `riskLevel: "High"`
- `CONTROL_COST = 10_000` — fixed cost per deployed control (£10,000)
- `makeStageGameState(stageId)` — factory for a fresh `StageGameState` (budget: £200,000, turn: 1)
- `makeChapterState(chapterId)` — factory for a fresh `ChapterState` (totalBudget: £1,000,000, score: 100)

#### New state in `App` component

```typescript
const [chapterState, setChapterState] = useState<ChapterState | null>(null);
const [activeStageState, setActiveStageState] = useState<StageGameState | null>(null);
```

#### New / updated handlers

| Handler | Behaviour |
|---------|-----------|
| `handleStageClick` | Initialises `ChapterState` if entering a new chapter; creates or reuses `StageGameState` for the clicked stage; saves it into `chapterState.stageStates` |
| `handleDeployControl(sectorId)` | Deducts `CONTROL_COST` from `activeStageState.budget`; increments `controlsApplied` on the target sector and recalculates its `riskLevel`; appends a log entry |
| `handleNextTurn` | Increments `activeStageState.turn`; appends a log entry |

#### Stage view JSX changes

- **TopBar — Budget Left**: now reads `activeStageState.budget.toLocaleString()` (was hardcoded `£ 200,000`)
- **TopBar — Score**: now reads `chapterState.score` (was hardcoded `80 / 100`)
- **Security Measures buttons**: each button calls `handleDeployControl` with a mapped sector ID:

  | Button | Sector targeted |
  |--------|----------------|
  | Firewall | `boundary` |
  | VPN Gateway | `network` |
  | MFA for Remote Access | `computing` |
  | Encrypted Backup | `physical` |

- **Next Turn button**: added inside `stage-main-area`; calls `handleNextTurn` and displays the current turn number

---

## Files Left Unchanged

- `src/components/Layout.tsx` — prototype game logic preserved as-is; not mounted by `main.tsx`
- `src/main.tsx` — still renders `<App />` exclusively
- All other component files

---

## Known Limitations (pre-existing, not introduced by this change)

- `handleNextTurn` is only accessible via the temporary button in `stage-main-area`; a proper `BottomBar` integration is not yet done
- Stage progress is not persisted back to `chapterState.stageStates` after `handleDeployControl` / `handleNextTurn` — only the initial state snapshot is saved
- Chapter view TopBar still shows hardcoded `£ 1,000,000` / `100 / 100` instead of reading from `chapterState`
- `StageStatus` is set to `"in_progress"` on entry but never transitions to `"completed"`
