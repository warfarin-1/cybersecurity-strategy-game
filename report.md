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
- ~~Stage progress is not persisted back to `chapterState.stageStates` after `handleDeployControl` / `handleNextTurn` — only the initial state snapshot is saved~~ **Fixed (2026-03-21)**
- ~~Chapter view TopBar still shows hardcoded `£ 1,000,000` / `100 / 100` instead of reading from `chapterState`~~ **Fixed (2026-03-21)**
- `StageStatus` is set to `"in_progress"` on entry but never transitions to `"completed"`

---

## Change Log — 2026-03-21 (State Sync Fix)

### `src/App.tsx`

#### `handleDeployControl` and `handleNextTurn` — state sync fix

Both handlers previously updated only `activeStageState` via a functional setter, leaving `chapterState.stageStates` stale.

**Fix:** Both handlers now compute the new `StageGameState` directly from the current `activeStageState`, then call both `setActiveStageState` and `setChapterState` in the same event handler, keeping the two in sync.

Additionally, `handleDeployControl` now deducts `CONTROL_COST` from `chapterState.remainingBudget` on each successful deployment.

#### Chapter view TopBar — live data

`Budget Left` and `Score` in the Chapter view TopBar previously showed hardcoded values.

**Fix:** Now reads `chapterState?.remainingBudget ?? 1_000_000` and `chapterState?.score ?? 100`, falling back to defaults when `chapterState` is `null` (i.e. the chapter has not been entered yet).

---

## Change Log — 2026-03-21 (Data Layer)

### New files added

#### `src/utils/dataLoader.ts`

Async data loader utility using `fetch()` to read files from `public/data/`.

Exports three interfaces and three loader functions:

| Export | Kind | Description |
|--------|------|-------------|
| `Control` | interface | controlId, name, description, cost (number), category, applicableRiskTypes (string[]), cafPrinciple |
| `Threat` | interface | threatId, level, riskType, scenarioName, severity, description, recommendedControlIds (string[]), cafPrinciple |
| `Level4Scenario` | interface | scenarioId, level, primaryRiskType, scenarioName, severity, description, subThreatIds, requiredControls, cafPrinciples |
| `loadControls()` | async fn | Fetches and parses `controls_library_level2_4.csv` → `Control[]` |
| `loadThreats(level)` | async fn | Fetches and parses `level{N}_threats.csv` → `Threat[]` |
| `loadLevel4Tree()` | async fn | Fetches `level4_threat_trees.json` → `Level4Scenario[]` |

CSV parsing handles double-quoted commas; semicolon-separated fields are split into string arrays; `cost` and `level` are cast to `number`.

#### `public/data/` — data files (served statically by Vite)

Copied from `src/data/` so they are accessible via `fetch()` at runtime:

- `controls_library_level2_4.csv` — 41 controls across 9 categories (Awareness, Governance, Identity, Data, System, Network, Monitoring, SupplyChain, Resilience)
- `level2_threats.csv` — 28 threats (Phishing / IAM / Data / Network)
- `level3_threats.csv` — 40 threats (Phishing / IAM / Data / Network / Endpoint)
- `level4_threats.csv` — 26 threats including 9 threat-tree sub-nodes
- `level4_threat_trees.json` — 3 scenario trees (IAM / Data / Network), each with 3 sub-threats and 3 required controls

#### `src/data/stageData.ts`

Static per-stage configuration registry.

Exports `StageConfig` interface, `STAGE_CONFIGS: Record<string, StageConfig>`, and `getStageConfig(stageId)`.

**`StageConfig` fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `stageId` | string | e.g. `"L2-1"` |
| `stageName` | string | Display name |
| `chapter` | 2 \| 3 \| 4 | Parent chapter |
| `budgetAllocation` | number | Starting budget for the stage |
| `threatIds` | string[] | Threats that appear in this stage |
| `availableControlIds` | string[] | Controls shown in the sidebar (includes distractors) |
| `requiredControlIds` | string[] | Controls that must be deployed to pass |
| `passingScore` | number | Minimum score to complete |

**L2 stage configurations (fully populated):**

| Stage | Threat IDs | Required Controls | Passing Score |
|-------|-----------|-------------------|---------------|
| L2-1 Phishing Basics | L2-PH-01/02/04/07 | C-AWARE-01/02, C-GOV-03 | 60 |
| L2-2 Identity & Access | L2-IAM-01/03/05/07 | C-IAM-01/02/06 | 60 |
| L2-3 Data Handling | L2-DATA-01/03/05/07 | C-DATA-01/04/05 | 60 |
| L2-4 Network Hygiene | L2-NET-01/03/04/07 | C-NET-01/03/05 | 60 |

Each L2 stage has 6 relevant controls + 2 distractors in `availableControlIds`. Threats are selected with a Low → Low → Medium → High severity gradient.

**L3 and L4 stages:** 7 placeholder configs with empty arrays; `passingScore` set to 65 (L3) and 70 (L4) for future use.

---

## Change Log — 2026-03-21 (Data Layer → UI Integration)

### `src/App.tsx`

#### New imports

| Import | Source |
|--------|--------|
| `useEffect` | `react` |
| `Control`, `Threat` (types) | `./utils/dataLoader` |
| `loadControls`, `loadThreats` | `./utils/dataLoader` |
| `getStageConfig` | `./data/stageData` |

#### New state

```typescript
const [stageThreats, setStageThreats] = useState<Threat[]>([]);
const [stageControls, setStageControls] = useState<Control[]>([]);
```

#### New `useEffect` — data loading

Fires whenever `view` changes. When `view.type === "stage"`:
1. Calls `getStageConfig(view.stageId)` to get the stage's threat/control ID lists
2. Parallel-fetches `loadThreats(view.chapter)` and `loadControls()`
3. Filters results to only the IDs listed in the config
4. Stores into `stageThreats` and `stageControls`

When leaving a stage view, both arrays are reset to `[]`.

#### `handleDeployControl` — signature and cost change

| Before | After |
|--------|-------|
| Parameter: `sectorId: string` | Parameter: `controlId: string` |
| Fixed cost: `CONTROL_COST = £10,000` | Variable cost: `control.cost * 10_000` |
| Sector from parameter | Sector derived via `controlToSector(control)` |
| Log: `Deployed control to "${sectorId}"` | Log: `Deployed "${control.name}"` |

**`controlToSector` mapping** (new module-level helper):

| Control category | Sector updated |
|-----------------|---------------|
| Network | `boundary` |
| Identity | `computing` |
| Data | `physical` |
| All others | `computing` |

The `CONTROL_COST` constant has been removed.

#### Stage view JSX — left sidebar (Security Measures)

Replaced 4 hardcoded buttons with a dynamic list:
- Renders one `<button>` per entry in `stageControls`
- Each button shows the control name and cost (`£{cost * 10,000}`)
- Clicking calls `handleDeployControl(control.controlId)`
- Displays `"Loading..."` while `stageControls` is empty

#### Stage view JSX — right sidebar (Threats)

Replaced 2 hardcoded buttons with a dynamic list:
- Renders one `<div>` per entry in `stageThreats`
- `severity === "High"` adds `sidebar-pill-danger` class (red border)
- Each item shows scenario name and a `<span className="threat-severity">` badge
- Displays `"Loading..."` while `stageThreats` is empty

#### Security Requirements section

Left unchanged (still hardcoded placeholder).
