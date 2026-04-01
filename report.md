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

---

## Change Log — 2026-03-22 (Duplicate Deploy Guard)

**Commit:** `0417ca4`

### `src/App.tsx`

#### New state

```typescript
const [deployedControlIds, setDeployedControlIds] = useState<string[]>([]);
```

Tracks which control IDs have been successfully deployed in the current stage session.

#### `handleStageClick` — reset on stage entry

`deployedControlIds` is reset to `[]` whenever a stage is entered, ensuring each stage starts with a clean deployment record.

#### `handleDeployControl` — duplicate guard

A check is performed at the start of the handler before any cost or sector logic:

- If `controlId` is already in `deployedControlIds`, a log entry `"Already deployed: {name}."` is appended and the function returns early.
- On successful deployment, `controlId` is added to `deployedControlIds` via `setDeployedControlIds((prev) => [...prev, controlId])`.

#### Stage view JSX — left sidebar button state

Control buttons now check `deployedControlIds.includes(control.controlId)`:

| State | `disabled` | Label |
|-------|-----------|-------|
| Not yet deployed | `false` | `{name}` |
| Already deployed | `true` | `{name} ✓` |

---

## Change Log — 2026-03-22 (Stage Completion & Scoring)

**Commit:** `6b54349`

### `src/App.tsx`

#### `handleDeployControl` — inline completion check

After computing `newDeployedIds = [...deployedControlIds, controlId]`:

1. Calls `getStageConfig(activeStageState.stageId)` to retrieve `requiredControlIds`.
2. If all required IDs are present in `newDeployedIds` (`Array.every`), marks the stage as complete:
   - `isCompleted: true`
   - `status: "completed"`
   - Appends log: `"✓ Stage complete! All required controls deployed."`
3. The completed state is written into both `activeStageState` and `chapterState.stageStates`.

#### `handleNextTurn` — score deduction

Each turn, unmitigated threats incur a score penalty against `chapterState.score`:

| Severity | Deduction per unmitigated threat |
|----------|----------------------------------|
| High | −10 pts |
| Medium | −3 pts |
| Low | −1 pt |

A threat is considered **mitigated** if any of its `recommendedControlIds` appears in `deployedControlIds`.

Score floor is `0` (`Math.max(0, prev.score - totalDeduction)`).

Log format: `"[T{n+1}] New turn. -{total} pts (High: {h}×10, Medium: {m}×3, Low: {l}×1)"`

If no stage config is found, turn advances with no deduction.

#### Stage view JSX — status banners

Two conditional banners added inside `stage-main-board`:

| Condition | Banner class | Message |
|-----------|-------------|---------|
| `activeStageState.isCompleted === true` | `.stage-status-success` | ✓ Stage Complete — All required controls deployed. |
| `chapterState.score < stageConfig.passingScore` | `.stage-status-warning` | ⚠ Score below passing threshold ({n}). |

#### Stage view JSX — Security Requirements (dynamic)

Replaced 3 hardcoded buttons with a dynamic list from `stageConfig.requiredControlIds`:

| Deploy state | Class | Prefix |
|-------------|-------|--------|
| Deployed | `.sidebar-pill-success` | `✓` |
| Not yet deployed | `.sidebar-pill-danger` | `✗` |

Control IDs are displayed directly (e.g. `C-AWARE-01`); human-readable names deferred to a later pass.

### `src/App.css`

New rules appended:

| Class | Purpose |
|-------|---------|
| `.sidebar-pill-success` | Green border/text/background for deployed requirement items |
| `.stage-status-success` | Green bordered banner for stage completion |
| `.stage-status-warning` | Red bordered banner for below-threshold score |

---

## Change Log — 2026-03-22 (Chapter Card Live Status)

**Commit:** `966e6fe`

### `src/App.tsx`

#### New helper — `getRiskTypeLabel(stageId)`

Module-level function. Reads `stageConfig.threatIds[0]` and maps its prefix to a human-readable label:

| Threat ID prefix | Label |
|-----------------|-------|
| `L2-PH` | Phishing |
| `L2-IAM` | Identity & Access |
| `L2-DATA` | Data Handling |
| `L2-NET` | Network |
| Empty / no config | TBD |
| Other | Mixed |

#### Chapter view — Stage card rendering

Stage cards now derive their display values from live state:

- **Risk Type:** `getRiskTypeLabel(stage.id)` (was hardcoded `"TBD"`)
- **Status:** read from `chapterState?.stageStates[stage.id]?.status`:

  | `StageStatus` value | Display text | Colour |
  |---------------------|-------------|--------|
  | `"not_started"` | Not started | Default |
  | `"in_progress"` | In progress | `#ffb84d` |
  | `"completed"` | ✓ Completed | `#4ade80` |

- **Completed card styling:** `stage-card-completed` class appended when `status === "completed"`.

### `src/App.css`

New rule appended:

| Class | Effect |
|-------|--------|
| `.stage-card-completed` | Green border (`#4ade80`), `opacity: 0.85` |

---

## Change Log — 2026-03-22 (BottomBar Integration)

**Commit:** `ac729a4`

### `src/components/BottomBar.tsx`

Interface extended with two optional props:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `isCompleted` | `boolean` | `false` | Disables Next Turn when stage is complete |
| `score` | `number` | — | Displays current score in the status bar |

**Rendering changes:**

- **Next Turn button:** `disabled` when `isCompleted`; label switches to `"Stage Complete"` (was always `"Next Turn"`); otherwise shows `"Next Turn (T{turn})"`.
- **Attack Sim button:** always `disabled`; label changed to `"Attack Sim (Coming Soon)"`.
- **Left status bar:** `budget` now formatted as `£{budget.toLocaleString()}`; `score` displayed as `"Score: {score}/100"` when the prop is present; removed hardcoded `totalBudget = 100`.

### `src/App.tsx`

- Imported `BottomBar` from `./components/BottomBar`.
- Removed the temporary `Next Turn` button from inside `stage-main-board`.
- `<BottomBar>` rendered at the bottom of the stage view with live props:

  | Prop | Source |
  |------|--------|
  | `turn` | `activeStageState?.turn ?? 1` |
  | `budget` | `activeStageState?.budget ?? 200_000` |
  | `score` | `chapterState?.score` |
  | `isCompleted` | `activeStageState?.isCompleted ?? false` |
  | `onNextTurn` | `handleNextTurn` |
  | `onRunAttackSimulation` | `() => {}` (no-op) |

---

## Change Log — 2026-03-22 (Security Requirements Full Names)

**Commit:** `73dfb45`

### `src/App.tsx`

Security Requirements sidebar previously displayed raw control IDs (e.g. `C-AWARE-01`).

**Fix:** For each `reqId` in `stageConfig.requiredControlIds`, looks up the matching entry in `stageControls` and renders `control?.name ?? reqId` — falling back to the raw ID only if the control hasn't loaded yet.

---

## Change Log — 2026-03-22 (Stage Unlock Mechanism)

**Commit:** `8d8dadb`

### `src/App.tsx`

#### New helper — `isStageUnlocked(stageId)`

Module-level function. Iterates `STAGES_BY_CHAPTER` to find the stage's index within its chapter:

- Index 0 → always unlocked.
- Index > 0 → unlocked only if `chapterState?.stageStates[prevStageId]?.status === "completed"`.
- Unknown stageId → returns `true` (fail-open).

#### Chapter view — Stage card rendering

Each card now calls `isStageUnlocked(stage.id)`:

- Locked cards use `cursor: "not-allowed"` inline style and `stage-card-locked` CSS class.
- `statusLabel` gains a `"🔒 Locked"` branch; `statusColor` is set to `#6b7280` (grey) when locked.

### `src/App.css`

New rules appended:

| Class | Effect |
|-------|--------|
| `.stage-card-locked` | `opacity: 0.45`, `cursor: not-allowed`, border `#444` |
| `.stage-card-locked:hover` | Suppresses hover transform and border-color change |

---

## Change Log — 2026-03-22 (Control Room Live Data)

**Commit:** `6c37936`

### `src/App.tsx`

#### Chapter view — Control Room panels

All four panels now derive their content from live state:

**Panel 1 — Known Security Measures**

Collects `requiredControlIds` from every completed stage in the chapter (via `getStageConfig`), deduplicates, and renders each as `✓ {id}`. Shows "No controls deployed yet" when empty.

**Panel 2 — Known Threat Types**

Maps each stage in the chapter through `getRiskTypeLabel(stageId)`, deduplicates via `Set`, and renders each label as `⚠ {label}`. Shows "No threats encountered yet" when empty.

**Panel 3 — Budget Overview**

Derives `totalBudget`, `remainingBudget`, and `spentBudget = total − remaining` from `chapterState` (defaults to £1,000,000 / £0 spent when null). Renders three rows.

**Panel 4 — Score & Deductions**

Shows `currentScore / 100`, `Passing Score: {chapterPassingScore}` (max `passingScore` across all stage configs in the chapter), and a status line: `"✓ On track"` or `"⚠ At risk"`.

---

## Change Log — 2026-03-22 (Chapter Unlock System)

**Commit:** `40b6bf6`

### `src/App.tsx`

#### New state

```typescript
const [completedChapters, setCompletedChapters] = useState<Set<number>>(new Set());
```

Tracks which chapter IDs (2, 3, 4) the player has fully completed.

#### New helper — `isChapterUnlocked(chapter)`

| Chapter | Condition |
|---------|-----------|
| 2 | Always unlocked |
| 3 | `completedChapters.has(2)` |
| 4 | `completedChapters.has(3)` |

#### `handleChapterClick` — guard

Returns early if `!isChapterUnlocked(chapterId)`.

#### `handleDeployControl` — chapter completion check

After a stage is marked `"completed"`, checks whether every stage in the chapter now has `status === "completed"` (treating the just-completed stage specially, since its `chapterState` entry is updated asynchronously). If all are done, adds the chapter ID to `completedChapters`.

#### Map view — Chapter card rendering

Cards now reflect unlock and completion status:

| State | CSS class added | Extra element rendered |
|-------|----------------|------------------------|
| Locked | `chapter-card-locked` | `"🔒 Complete Level {n-1} to unlock"` label |
| Unlocked + completed | — | `"✓ Completed"` label |

### `src/App.css`

New rules appended:

| Class | Effect |
|-------|--------|
| `.chapter-card-locked` | `opacity: 0.45`, `cursor: not-allowed` |
| `.chapter-card-locked:hover` | Suppresses hover animation |
| `.chapter-lock-label` | Small grey label below card subtitle |
| `.chapter-complete-label` | Green (`#4ade80`) bold label below card subtitle |

---

## Change Log — 2026-03-22 (L3 Stage Configs)

**Commit:** `2b8b882`

### `src/data/stageData.ts`

All four L3 stage configs populated with real threat and control data (previously empty arrays):

| Stage | Threat IDs | Required Controls | Passing Score |
|-------|-----------|-------------------|---------------|
| L3-1 Targeted Phishing | L3-PH-01/03/04/05/06/07 | C-AWARE-03, C-GOV-03, C-IAM-04, C-MON-02 | 65 |
| L3-2 Cloud Identity | L3-IAM-01/02/05/06/07/08 | C-IAM-04, C-IAM-05, C-IAM-01, C-GOV-02 | 65 |
| L3-3 Data at Scale | L3-DATA-02/03/04/06/07/08 | C-DATA-06, C-DATA-02, C-DATA-04, C-IR-01 | 65 |
| L3-4 Network Exposure | L3-NET-02/06/07/09, L3-END-01/05 | C-NET-02, C-MON-01, C-SYS-06, C-SYS-03 | 65 |

Each stage has 7–9 `availableControlIds` (core controls + distractors from unrelated categories). All threats follow a Medium × 4 + High × 2 severity distribution.

### `src/App.tsx`

Removed a now-redundant early-return guard in the `useEffect` data loader that was skipping stages with empty `threatIds`.

---

## Change Log — 2026-03-22 (getRiskTypeLabel Substring Match)

**Commit:** `1a43ec9`

### `src/App.tsx`

`getRiskTypeLabel` previously used `String.startsWith("L2-PH")` etc., so L3/L4 threat IDs (e.g. `L3-PH-01`) were never matched and always returned `"Mixed"`.

**Fix:** Switched all comparisons to `String.includes("-PH")`, `includes("-IAM")`, `includes("-DATA")`, `includes("-NET")`, `includes("-END")`. The function now works correctly for all chapter levels.

---

## Change Log — 2026-03-22 (stageData Required Control Fixes)

**Commit:** `b70f56b`

### `src/data/stageData.ts`

#### L2-1 — orphan required control

`C-GOV-03` was listed in `requiredControlIds` but had no threat in `threatIds` that recommended it, making it unmitigatable. Fixed by adding `L2-PH-05` (Medium, recommends `C-GOV-03`) to the threat list.

`C-SYS-03` added to `requiredControlIds` (counters `L2-PH-07`, the High-severity phishing threat already present).

Updated `requiredControlIds`: `["C-AWARE-01", "C-AWARE-02", "C-GOV-03", "C-SYS-03"]`

#### All stages — High threats must have a required control

Audit across all 8 populated stages (L2-1 through L3-4): every High-severity threat now has at least one of its `recommendedControlIds` present in the stage's `requiredControlIds`. Previously several High threats could go entirely unmitigated without blocking stage completion.

---

## Change Log — 2026-03-22 (deployedControlIds Persistence & Loading Guard)

**Commit:** `fdeffd0`

### `src/types.ts`

`deployedControlIds: string[]` added to `StageGameState` interface, enabling deployed control state to survive stage re-entry.

### `src/App.tsx`

#### `makeStageGameState` — initialise field

`deployedControlIds: []` added to the factory function so all new stage states are valid.

#### `handleDeployControl` — persist to StageGameState

`newDeployedIds` written into `newStageState.deployedControlIds`, so the array is stored in `chapterState.stageStates` and survives navigation away and back.

#### `handleStageClick` — restore on re-entry

Changed `setDeployedControlIds([])` → `setDeployedControlIds(stageState.deployedControlIds)`, so previously deployed controls are restored when the player re-enters a stage.

#### Data loading — `dataLoading` state

```typescript
const [dataLoading, setDataLoading] = useState(false);
```

Set to `true` before the `Promise.all` fetch, `false` in the `.then` callback. Passed to `<BottomBar isLoading={dataLoading} />`.

### `src/components/BottomBar.tsx`

New optional prop `isLoading?: boolean` (default `false`):

- Next Turn button `disabled` when `isLoading || isCompleted`.
- Button label: `"Loading..."` → `"Stage Complete"` → `"Next Turn (T{n})"` (priority order).

---

## Change Log — 2026-03-22 (Score Label & localStorage Persistence)

**Commit:** `1b1bff5`

### `src/App.tsx`

#### `completedChapters` — localStorage persistence

`useState` initialiser changed to a lazy function that reads `localStorage.getItem("completedChapters")` and parses it as `number[]` into a `Set`. Wrapped in try/catch; returns an empty Set on any error.

When a chapter is completed, `setCompletedChapters` now also calls `localStorage.setItem("completedChapters", JSON.stringify([...next]))` so progress survives page refresh.

#### Stage view TopBar — score label

`stat-label` text changed from `"Score"` → `"Chapter Score"` to clarify that the figure reflects the whole chapter's accumulated deductions, not just the current stage.

---

## Change Log — 2026-03-22 (sidebar-loading, L4 Empty State, Chapter Switch Reset)

**Commit:** `3f34a59`

### `src/App.css`

New rule appended:

```css
.sidebar-loading {
    font-size: 12px;
    color: #6b7280;
    padding: 4px 8px;
    font-style: italic;
}
```

Previously the class was used in JSX but undefined in any stylesheet, causing unstyled text.

### `src/App.tsx`

#### Left sidebar (Security Measures) — L4 empty state

| Before | After |
|--------|-------|
| `stageControls.length === 0 ? "Loading..." : list` | `dataLoading ? "Loading..." : stageControls.length === 0 ? "No controls available" : list` |

For L4 placeholder stages (empty `availableControlIds`), the sidebar now correctly shows "No controls available" after loading completes instead of remaining stuck at "Loading...".

#### Right sidebar (Threats) — L4 empty state

Same pattern applied: `dataLoading ? "Loading..." : stageThreats.length === 0 ? "No threats available" : list`.

#### `handleChapterClick` — reset chapterState on chapter switch

Previously, navigating from one chapter to another left `chapterState` pointing at the old chapter's data, causing the Control Room to display stale budget and score until the player clicked a stage.

**Fix:** Added a `setChapterState` call inside `handleChapterClick`:

```typescript
setChapterState((prev) =>
    prev?.chapterId === chapterId ? prev : makeChapterState(chapterId)
);
```

Same-chapter navigation preserves existing state; different-chapter navigation initialises a fresh `ChapterState` immediately.

---

## Change Log — 2026-03-22 (L4 Stage Configs)

**Commit:** `22d0b91` (partial — stageData.ts portion)

### `src/data/stageData.ts`

All three L4 stage configs populated with real threat and control data (previously empty arrays). Budget allocation raised from £200,000 to £300,000 for all L4 stages.

Each stage uses the following structure:
- **3 scenario sub-threats** (threat-tree nodes) + **2 standalone threats** (one High, one Medium)
- **3 scenario-required controls** + **2 supporting controls** + **2 distractors** = 7 `availableControlIds`
- **3 `requiredControlIds`** (matching the scenario's `requiredControls`)
- **`passingScore`: 70**

| Stage | Scenario | subThreatIds | requiredControlIds |
|-------|----------|-------------|-------------------|
| L4-1 High-Risk Identity Chain | L4-B2-SCENARIO-01 (IAM) | L4-IAM-C1-R1/R2/R3 | C-IAM-04, C-IAM-01, C-GOV-02 |
| L4-2 Large Data Exposure | L4-B3-SCENARIO-01 (Data) | L4-DATA-C2-R1/R2/R3 | C-DATA-08, C-DATA-03, C-DATA-06 |
| L4-3 Critical Service Compromise | L4-B4-SCENARIO-01 (Network) | L4-NET-C3-R1/R2/R3 | C-SYS-02, C-NET-02, C-MON-01 |

**Standalone threats per stage:**

| Stage | High threat | Medium threat |
|-------|------------|--------------|
| L4-1 | L4-IAM-01 (Multiple Privileged Accounts Compromised) | L4-IAM-02 (No Separation Between Admin and User Accounts) |
| L4-2 | L4-DATA-01 (Large-Scale Exposure of Personal Data) | L4-DATA-03 (Untracked Copies of Highly Confidential Data) |
| L4-3 | L4-NET-01 (Critical System Directly Exposed to Internet) | L4-NET-04 (Inadequate Monitoring of Critical Network Segments) |

All IDs verified against `level4_threats.csv` and `controls_library_level2_4.csv`. `requiredControlIds ⊆ availableControlIds` confirmed for all three stages.

---

## Change Log — 2026-03-22 (L4 Threat Tree Visualisation)

**Commit:** `22d0b91`

### `src/App.tsx`

#### New import

`Level4Scenario` type and `loadLevel4Tree` function imported from `./utils/dataLoader`.

#### New state

```typescript
const [level4Scenario, setLevel4Scenario] = useState<Level4Scenario | null>(null);
```

Holds the active scenario for L4 stages; `null` when not in an L4 stage or while loading.

#### `useEffect` — L4 data loading branch

The existing `useEffect` (fires on `view` change) now branches on `view.chapter`:

- **Chapter 4:** `Promise.all([loadThreats(4), loadControls(), loadLevel4Tree()])`, then maps `stageId` to `scenarioId` via a local lookup table and stores the matching scenario in `level4Scenario`.
- **Chapter 2 / 3:** original `Promise.all([loadThreats(chapter), loadControls()])`, sets `level4Scenario` to `null`.
- **Non-stage view:** sets `level4Scenario` to `null` immediately and returns.

StageId → ScenarioId mapping:

| stageId | scenarioId |
|---------|-----------|
| `L4-1` | `L4-B2-SCENARIO-01` |
| `L4-2` | `L4-B3-SCENARIO-01` |
| `L4-3` | `L4-B4-SCENARIO-01` |

#### `stage-main-board` — conditional rendering

`stage-main-board` now renders differently based on chapter:

**When `view.chapter === 4` and `level4Scenario !== null`** — renders a `.threat-tree-panel` containing:

1. **Scenario header** (`.threat-scenario-header`): scenario name in red, description in grey.
2. **"Attack Chain" label** (`.threat-chain-label`).
3. **One node per `subThreatId`** (`.threat-node`): displays the sub-threat ID, its `scenarioName` (looked up from `stageThreats`), and a live mitigated/unresolved badge. A node is mitigated when at least one of the threat's `recommendedControlIds` appears in `deployedControlIds`.
4. **Score warning banner** (`.stage-status-warning`) if score is below passing threshold.
5. **Completion banner** (`.stage-status-success`) if stage is completed.

**Otherwise (L2 / L3)** — existing banners + placeholder text unchanged.

### `src/App.css`

New rules appended for the threat tree UI:

| Class | Purpose |
|-------|---------|
| `.threat-tree-panel` | Flex column container, scrollable, padding 16px |
| `.threat-scenario-header` | Red-bordered card for scenario title and description |
| `.threat-scenario-title` | Red (`#f87171`) 14px bold label |
| `.threat-scenario-desc` | Grey (`#9ca3af`) 12px description text |
| `.threat-chain-label` | Small grey uppercase section label |
| `.threat-node` | Base node style: flex row, space-between, rounded border |
| `.threat-node-unresolved` | Red border + faint red background |
| `.threat-node-mitigated` | Green border + faint green background |
| `.threat-node-id` | Grey 11px sub-label showing the threat ID |
| `.threat-node-name` | 13px threat scenario name |
| `.threat-node-status-resolved` | Green (`#4ade80`) status badge |
| `.threat-node-status-unresolved` | Red (`#f87171`) status badge |

---

## Change Log — 2026-03-22 (L4 Threat Tree Completion Logic)

**Commit:** `6237e35`

### `src/App.tsx`

#### `handleDeployControl` — chapter-specific completion check

The inline completion check now branches on chapter:

**L2 / L3 (chapter ≠ 4):**
```
allRequiredDeployed = stageConfig.requiredControlIds.every(id => newDeployedIds.includes(id))
```
Behaviour unchanged from previous implementation.

**L4 (chapter === 4, `level4Scenario` loaded):**
```
allSubThreatsMitigated = level4Scenario.subThreatIds.every(subThreatId => {
    threat = stageThreats.find(t => t.threatId === subThreatId)
    return threat?.recommendedControlIds.some(cId => newDeployedIds.includes(cId))
})
```

A sub-threat is considered mitigated when at least one of its `recommendedControlIds` has been deployed. All three sub-threats must be mitigated for `stageJustCompleted` to become `true`.

If `level4Scenario` is `null` (still loading), the L4 check is skipped entirely — the stage cannot be marked complete while data is absent.

Both paths share the same `stageJustCompleted` flag and downstream logic (writing `isCompleted: true`, `status: "completed"`, updating `chapterState`, triggering chapter-unlock check).

**Completion log messages:**

| Chapter | Log entry |
|---------|-----------|
| L2 / L3 | `"✓ Stage complete! All required controls deployed."` |
| L4 | `"✓ Attack chain neutralised! All sub-threats mitigated."` |

#### `stage-main-board` — L4 completion banner text

L4 completion banner changed from the generic message to:

> ✓ Attack Chain Neutralised! All sub-threats have been mitigated. The scenario has been contained.

L2 / L3 completion banner text unchanged.

#### Static validation (L4-1 trace)

Deploying `C-IAM-04 → C-IAM-01 → C-GOV-02` against scenario `L4-B2-SCENARIO-01`:

| Step | newDeployedIds | R1 (→C-IAM-04) | R2 (→C-IAM-01) | R3 (→C-GOV-02) | allSubThreatsMitigated |
|------|---------------|---------------|---------------|---------------|----------------------|
| Deploy C-IAM-04 | [C-IAM-04] | ✓ | ✗ | ✗ | false |
| Deploy C-IAM-01 | [C-IAM-04, C-IAM-01] | ✓ | ✓ | ✗ | false |
| Deploy C-GOV-02 | [C-IAM-04, C-IAM-01, C-GOV-02] | ✓ | ✓ | ✓ | **true → stage complete** |

---

## Change Log — 2026-03-22 (Beginner / Expert Mode)

**Commit:** `3ebb572`

### `src/App.tsx`

#### New state

```typescript
const [gameMode, setGameMode] = useState<"beginner" | "expert">("beginner");
```

Defaults to `"beginner"`. Persists for the session; resets to Beginner on page refresh.

#### Map view — mode selector

A mode selector UI is rendered above the chapter cards:

- Two toggle buttons (`Beginner` / `Expert`) using `.mode-btn` / `.mode-btn-active` classes.
- A `.mode-description` paragraph below the selector that updates based on the active mode:

| Mode | Description shown |
|------|------------------|
| Beginner | "Recommended controls are highlighted to guide your decisions." |
| Expert | "No hints provided. Analyse threats and choose controls independently." |

#### Stage view — left sidebar (Security Measures)

Control buttons now reflect `gameMode`:

**Beginner mode:** For each control, checks whether its `controlId` appears in any `stageThreats[n].recommendedControlIds`. If so:
- Button label prefixed with `⭐ `
- Button receives additional class `.control-recommended` (orange border and text)

**Expert mode:** No prefix, no extra class. Buttons display control name only.

Already-deployed controls show `{name} ✓` regardless of mode.

#### Stage view — right sidebar (Threats)

Threat items now reflect `gameMode`:

**Beginner mode:** For each threat, looks up `stageControls.find(c => threat.recommendedControlIds.includes(c.controlId))`. If found, renders a `.threat-hint` line below the threat name:
```
Hint: {control.name}
```

**Expert mode:** No hint line rendered. Only threat name and severity badge shown.

#### Stage view — L4 threat tree nodes

Sub-threat nodes now reflect `gameMode`:

**Beginner mode:** For each sub-threat node, looks up the matching control from `stageControls` and renders a `.threat-hint` line inside the node:
```
Deploy: {control.name}
```

**Expert mode:** Node displays threat ID, scenario name, and mitigated/unresolved status only — no deployment hint.

### `src/App.css`

New rules appended:

| Class | Purpose |
|-------|---------|
| `.mode-selector` | Flex row, centred, gap 8px, margin-bottom 24px |
| `.mode-label` | Small grey label ("Game Mode:") |
| `.mode-btn` | Pill-shaped toggle button, transparent background, grey border |
| `.mode-btn:hover` | Blue border and text on hover |
| `.mode-btn-active` | Blue fill (`#7dd3fc`), dark text — active mode indicator |
| `.mode-description` | Small italic grey text below selector |
| `.threat-hint` | 11px italic grey hint text inside threat / node items |
| `.control-recommended` | Orange border and text for beginner-highlighted control buttons |

---

## Change Log — 2026-03-22 (L2/L3 Threat Status Visualisation)

**Commit:** `feat: L2/L3 threat status visualization in stage-main-board`

### `src/App.tsx`

#### `stage-main-board` — L2/L3 else branch

Replaced the static placeholder text with a live threat status panel.

**Before:**
```tsx
<div className="stage-main-placeholder">
    Here we will visualise where controls are deployed and how threats are mitigated.
</div>
```

**After:** A `.threat-status-panel` containing one `.threat-node` per entry in `stageThreats`, using the same node components as the L4 threat tree:

| Element | Content |
|---------|---------|
| `.threat-node-name` | `threat.scenarioName` |
| `.threat-node-severity` | `"Severity: {threat.severity}"` |
| `.threat-hint` (Beginner only) | `"Hint: Deploy {recommendedControl.name}"` |
| Status badge | `"✓ Mitigated"` (green) or `"⚠ Unresolved"` (red) |

A threat is considered **mitigated** when any of its `recommendedControlIds` appears in `deployedControlIds` — identical logic to the L4 sub-threat check.

An empty-state fallback renders `"Loading threats..."` when `stageThreats.length === 0`.

The Beginner hint looks up `stageControls.find(c => threat.recommendedControlIds.includes(c.controlId))` — same pattern as the right sidebar hint, but rendered inside the central panel node instead.

### `src/App.css`

Two new rules appended (inserted before the Beginner/Expert Mode section):

| Class | Purpose |
|-------|---------|
| `.threat-status-panel` | Flex column, gap 8px, padding 12px, full height, scrollable |
| `.threat-node-severity` | 11px grey severity label inside each node |

---

## Change Log — 2026-03-22 (ESLint setState-in-effect Fix)

**Commit:** `feat: L2/L3 threat status visualization in stage-main-board` (same commit)

### `src/App.tsx`

#### `useEffect` — removed synchronous `setState` calls

ESLint rule `react-hooks/set-state-in-effect` flagged two synchronous `setLevel4Scenario(null)` calls inside the data-loading `useEffect`:

1. **Non-stage branch** (`view.type !== "stage"`): the call was removed entirely. The render is already guarded by `view.chapter === 4 && level4Scenario !== null`, so a stale `level4Scenario` value is never rendered when outside a stage view.

2. **L2/L3 branch** (`chapter !== 4`): `setLevel4Scenario(null)` was moved from the synchronous effect body into the `.then()` callback, alongside the other state updates.

All `setState` calls inside the effect are now exclusively inside `.then()` callbacks, satisfying the rule. Functional behaviour is unchanged.

---

## Change Log — 2026-03-22 (gameMode localStorage Persistence)

**Commit:** `feat: persist gameMode to localStorage`

### `src/App.tsx`

#### `gameMode` state — lazy initialiser

`useState` changed from a plain default to a lazy initialiser that reads `localStorage`:

```typescript
const [gameMode, setGameMode] = useState<"beginner" | "expert">(() => {
    try {
        const saved = localStorage.getItem("gameMode");
        return saved === "expert" ? "expert" : "beginner";
    } catch {
        return "beginner";
    }
});
```

Only `"expert"` is matched explicitly; any other value (missing key, `null`, or unexpected string) falls back to `"beginner"`. Wrapped in try/catch for environments where `localStorage` access throws.

#### Mode toggle buttons — write on change

Both mode buttons' `onClick` handlers now write to `localStorage` immediately after calling `setGameMode`:

```typescript
onClick={() => { setGameMode("beginner"); localStorage.setItem("gameMode", "beginner"); }}
onClick={() => { setGameMode("expert");   localStorage.setItem("gameMode", "expert");   }}
```

**Effect:** Mode selection survives page refresh. Consistent with the existing persistence pattern used for `completedChapters`.

---

## Change Log — 2026-03-22 (Bilingual Data Loader)

**Commit:** `feat: extend dataLoader interfaces and functions with bilingual support`

### `src/utils/dataLoader.ts`

#### Interface extensions

All three exported interfaces extended with Chinese text fields:

| Interface | New fields added |
|-----------|-----------------|
| `Control` | `nameZh: string`, `descriptionZh: string` |
| `Threat` | `scenarioNameZh: string`, `descriptionZh: string` |
| `Level4Scenario` | `scenarioNameZh: string`, `descriptionZh: string` |

#### Loader signature changes

All three loader functions now accept an optional `lang?: "en" | "zh"` parameter:

| Function | English file | Chinese file |
|----------|-------------|-------------|
| `loadControls(lang?)` | `controls_library_level2_4.csv` | `controls_library_level2_4_bilingual.csv` |
| `loadThreats(level, lang?)` | `level{N}_threats.csv` | `level{N}_threats_bilingual.csv` |
| `loadLevel4Tree(lang?)` | `level4_threat_trees.json` | `level4_threat_trees_bilingual.json` |

#### Bilingual CSV column layouts

Bilingual files insert additional columns relative to the English layout:

**Controls bilingual** (`ControlID, Name, Name_ZH, Description, Description_ZH, Cost, Category, ApplicableRiskTypes, CAF_Principle`):
- `f[2]` = `nameZh`, `f[4]` = `descriptionZh`, indices 5–8 shift right by 2

**Threats bilingual** (`ThreatID, Level, RiskType, ScenarioName, ScenarioName_ZH, Severity, Description, Description_ZH, RecommendedControlID, CAF_Principle`):
- `f[4]` = `scenarioNameZh`, `f[7]` = `descriptionZh`, indices 8–9 shift right

**L4 JSON bilingual**: adds `scenarioName_ZH` and `description_ZH` fields, mapped to `scenarioNameZh` / `descriptionZh` via `?? ""`.

#### English mode behaviour

When `lang` is `"en"` or omitted, the existing English-only files are loaded and all ZH fields are set to `""`.

---

## Change Log — 2026-03-22 (EN/ZH Language Switching)

**Commit:** `feat: add EN/ZH language switching with bilingual data loading`

### `src/App.tsx`

#### New state

```typescript
const [language, setLanguage] = useState<"en" | "zh">(() => {
    try {
        const saved = localStorage.getItem("language");
        return saved === "zh" ? "zh" : "en";
    } catch { return "en"; }
});
```

Persisted to `localStorage`; defaults to English.

#### Translation helpers (module-level within component)

```typescript
const t = (en: string, zh: string) => language === "zh" ? zh : en;
const controlName = (c: Control) => language === "zh" && c.nameZh ? c.nameZh : c.name;
const threatName  = (th: Threat) => language === "zh" && th.scenarioNameZh ? th.scenarioNameZh : th.scenarioName;
```

#### `dataLoading` derived value — language-aware key

```typescript
const dataLoading = view.type === "stage" && loadedForStageId !== `${view.stageId}:${language}`;
```

`loadedForStageId` is now stored as `"${stageId}:${language}"` (e.g. `"L2-1:zh"`). Switching language while inside a stage triggers a fresh data load with the new locale.

#### `useEffect` — loaders receive `language`

All three loader calls updated to pass the current language:

```typescript
Promise.all([loadThreats(4, language), loadControls(language), loadLevel4Tree(language)])
Promise.all([loadThreats(chapter, language), loadControls(language)])
```

Effect dependency array extended: `[view, language]`.

#### Language selector UI

A second mode-selector row added to the map view (below the mode-description paragraph):

```tsx
<div className="mode-selector">
    <span className="mode-label">Language:</span>
    <button className={`mode-btn ${language === "en" ? "mode-btn-active" : ""}`} ...>English</button>
    <button className={`mode-btn ${language === "zh" ? "mode-btn-active" : ""}`} ...>中文</button>
</div>
```

Reuses existing `.mode-selector` / `.mode-btn` / `.mode-btn-active` CSS — no new stylesheet rules needed.

#### Text translations applied

All visible UI text is now routed through `t()`, `controlName()`, or `threatName()`:

| View | Translated elements |
|------|-------------------|
| Map | Title, subtitle, Game Mode label/buttons, mode description, chapter lock/complete labels |
| Chapter | TopBar labels, Control Room panel titles and content labels, stage status tags |
| Stage (TopBar) | "Budget Left" → 剩余预算, "Chapter Score" → 章节得分 |
| Stage (left sidebar) | "Security Measures" title, loading/empty states, control button labels via `controlName()` |
| Stage (center L4) | Scenario name/description ZH fields, "Attack Chain", threat node names via `threatName()`, deploy hint via `controlName()`, status badges, banners |
| Stage (center L2/L3) | "Threat Status", threat node names via `threatName()`, severity label, hint via `controlName()`, status badges, banners |
| Stage (right sidebar) | "Security Requirements" / "Threats" titles, requirement names via `controlName()`, threat names via `threatName()`, hint control via `controlName()`, loading states |

### `src/components/BottomBar.tsx`

New optional prop `language?: "en" | "zh"` (default `"en"`). A local `t()` helper translates:

| Element | English | Chinese |
|---------|---------|---------|
| Turn label | Turn | 回合 |
| Budget label | Budget | 预算 |
| Score label | Score | 得分 |
| Next Turn button | Next Turn (T{n}) | 下一回合 (T{n}) |
| Loading state | Loading... | 加载中... |
| Completed state | Stage Complete | 关卡完成 |
| Attack Sim button | Attack Sim (Coming Soon) | 攻击模拟（即将推出） |

---

## Change Log — 2026-03-23 (Cybersecurity Glossary Panel)

**Commit:** `7b6af54`

### `src/App.tsx`

#### New module-level component — `GlossaryPanel`

Defined before the `App` component. Accepts two props:

| Prop | Type | Purpose |
|------|------|---------|
| `language` | `"en" \| "zh"` | Controls bilingual display and data loading |
| `onClose` | `() => void` | Callback to close the overlay |

**Internal state:**

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `activeTab` | `"controls" \| "threats"` | `"controls"` | Active content tab |
| `searchQuery` | `string` | `""` | Live search filter text |
| `allControls` | `Control[]` | `[]` | Full controls list loaded on mount |
| `allThreats` | `Threat[]` | `[]` | Merged L2+L3+L4 threats, sorted by level |
| `loading` | `boolean` | `true` | Loading state shown while fetching |

**`useEffect` — parallel data load:**

Fires on mount and when `language` changes. Calls:
```typescript
Promise.all([
    loadControls(language),
    loadThreats(2, language),
    loadThreats(3, language),
    loadThreats(4, language),
])
```
Merges the three threat arrays and sorts by `level` ascending.

**Search filtering:**

`filteredControls` — case-insensitive match on `controlId`, `name`, `nameZh`, `category`.
`filteredThreats` — case-insensitive match on `threatId`, `scenarioName`, `scenarioNameZh`, `riskType`.
Empty query shows all entries.

**Layout structure:**

```
glossary-overlay (click-outside closes)
  └─ glossary-panel (stopPropagation)
       ├─ glossary-header: title h2 + ✕ close button
       ├─ glossary-search: real-time search input
       ├─ glossary-tabs: "Security Controls (n)" | "Threats (n)"
       └─ glossary-content (scrollable)
            ├─ [loading] sidebar-loading text
            ├─ [controls tab] one glossary-item per control
            │    ├─ glossary-item-header: controlId · category badge · cost (£)
            │    ├─ glossary-item-name: nameZh / name
            │    ├─ glossary-item-desc: descriptionZh / description
            │    └─ glossary-item-caf: CAF principle
            └─ [threats tab] one glossary-item per threat
                 ├─ glossary-item-header: threatId · severity badge · riskType badge
                 ├─ glossary-item-name: scenarioNameZh / scenarioName
                 ├─ glossary-item-desc: descriptionZh / description
                 └─ glossary-item-caf: recommended control IDs
```

Severity badges use `.severity-high` / `.severity-medium` / `.severity-low` colour classes.

#### New state in `App`

```typescript
const [glossaryOpen, setGlossaryOpen] = useState(false);
```

#### Glossary button — all three views

A `📖 Glossary / 安全图鉴` button (`.glossary-btn`) is added to the TopBar of every view:

| View | Placement |
|------|-----------|
| Map | Direct child of `<header className="top-bar">`, after subtitle — `margin-left: auto` pushes it right |
| Chapter | Inside `.top-bar-right` div, after the stat boxes |
| Stage | Inside `.top-bar-right` div, after the stat boxes |

All three use `onClick={() => setGlossaryOpen(true)}` and display `t("Glossary", "安全图鉴")`.

#### Overlay rendered in all three view returns

```tsx
{glossaryOpen && <GlossaryPanel language={language} onClose={() => setGlossaryOpen(false)} />}
```

Added as the last child of each view's root `<div className="app-root">`.

### `src/App.css`

New rules appended (Glossary section):

| Class | Purpose |
|-------|---------|
| `.glossary-btn` | TopBar pill button, transparent with grey border; hover turns blue |
| `.glossary-overlay` | Fixed full-screen dark backdrop (`rgba(0,0,0,0.7)`), z-index 1000, flex-centred |
| `.glossary-panel` | Modal panel: 680px wide, 80vh tall, dark `#0d1117` background, rounded 12px |
| `.glossary-header` | Panel title bar with h2 and close button, bottom border |
| `.glossary-close` | Transparent ✕ button, grey text, hover turns white |
| `.glossary-search` | Dark input field with focus border highlight (`#7dd3fc`) |
| `.glossary-tabs` | Flex tab row with underline active indicator |
| `.glossary-tab` | Transparent tab button, active state: blue text + blue underline |
| `.glossary-content` | Scrollable flex-column content area |
| `.glossary-item` | Dark card (`#161b22`) for each control or threat entry |
| `.glossary-item-header` | Flex row: id · category · cost/severity, wraps on narrow widths |
| `.glossary-item-id` | Monospace 11px grey ID label |
| `.glossary-item-category` | Blue-tinted pill badge for category or risk type |
| `.glossary-item-cost` | Orange (`#ffb84d`) cost label, pushed right via `margin-left: auto` |
| `.glossary-item-severity` | Severity pill badge (coloured via severity-* classes) |
| `.glossary-item-name` | 14px semi-bold entry title |
| `.glossary-item-desc` | 12px grey description text, 1.5 line-height |
| `.glossary-item-caf` | 11px grey CAF principle / recommended control footnote |
| `.severity-high` | Red text (`#f87171`) |
| `.severity-medium` | Orange text (`#ffb84d`) |
| `.severity-low` | Green text (`#4ade80`) |

---

## Change Log — Undo Control Deployment

**Date:** 2026-03-23

### Overview

Added the ability to undo (retract) a previously deployed control within a Stage, refunding its cost and reverting completion status.

### `src/App.tsx`

#### New handler: `handleUndoControl(controlId)`

- Finds the control in `stageControls`; returns early if not found or not deployed
- Calculates `refund = control.cost * 10_000`
- Removes `controlId` from `deployedControlIds`
- Builds a new `StageGameState` with budget increased by refund, `isCompleted: false`, `status: "in_progress"`, and an `↩ Undid: …` log entry (uses `control.nameZh` when language is `"zh"`)
- Calls `setActiveStageState`, `setDeployedControlIds`, and `setChapterState` (increments `remainingBudget` by refund)

#### Stage view — left sidebar control button rendering

Previously: deployed controls rendered as a single `disabled` button.

Now: deployed controls render as a `<div className="control-deployed-row">` containing:
- A `disabled` pill button showing `{name} ✓` and cost
- An `↩` undo button (`className="undo-btn"`) that calls `handleUndoControl`

Undeployed controls are unchanged (no `disabled` attribute; `deployed` branch now handles disabling implicitly via separate render path).

### `src/App.css`

New rules added after `.sidebar-pill-success`:

| Class | Purpose |
|-------|---------|
| `.control-deployed-row` | Flex row wrapping the deployed pill + undo button, `gap: 4px` |
| `.control-deployed-row .sidebar-pill` | `flex: 1` so the pill fills remaining space |
| `.undo-btn` | Transparent button with grey border, 12px font; hover turns red (`#f87171`) |

---

## Change Log — Reset Stage from Chapter View

**Date:** 2026-03-23

### Overview

Added a Reset Stage button on each Stage card in the Chapter view, allowing players to wipe a stage's progress and reclaim the spent budget.

### `src/App.tsx`

#### New handler: `handleResetStage(stageId)`

- Guards: requires `chapterState` and an existing `stageStates[stageId]`; looks up `StageConfig` via `getStageConfig`
- Calculates `spent = config.budgetAllocation - stageState.budget`; `refund = Math.max(0, spent)`
- Builds `resetStageState`: resets `budget` to `config.budgetAllocation`, clears `deployedControlIds`, sets `isCompleted: false`, `status: "not_started"`, `turn: 1`, `logs: []`
- Updates `chapterState`: increments `remainingBudget` by refund, replaces `stageStates[stageId]` with the reset state
- If `activeStageState.stageId === stageId`, also calls `setActiveStageState(resetStageState)` and `setDeployedControlIds([])`
- Checks whether all other stages in the chapter are still `"completed"`; if not, removes the chapter from `completedChapters` and updates `localStorage`

#### Chapter view — Stage card rendering

Added `hasProgress` flag (`status === "in_progress" || status === "completed"`).

When `hasProgress` is true, a Reset button is rendered inside the Stage card:

```tsx
<button
  className="stage-reset-btn"
  onClick={(e) => { e.stopPropagation(); handleResetStage(stage.id); }}
>
  {t("↺ Reset Stage", "↺ 重置关卡")}
</button>
```

`e.stopPropagation()` prevents the card's `onClick` (which navigates into the stage) from firing.

### `src/App.css`

New rules added after `.undo-btn:hover`:

| Class | Purpose |
|-------|---------|
| `.stage-reset-btn` | Full-width transparent button, grey border, 11px font, `margin-top: 8px` |
| `.stage-reset-btn:hover` | Border and text turn red (`#f87171`) |

---

## Change Log — Inter Font, BottomBar Styles, Refined Hover Effects

**Date:** 2026-03-30

### Overview

Unified typography with the Inter typeface and refined interactive hover effects across chapter cards, stage cards, and sidebar control buttons. Added dedicated CSS classes for the BottomBar component.

---

### `index.html`

Added Google Fonts preconnect and Inter stylesheet link in `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### `src/App.css`

#### Typography

- `.app-root` `font-family` updated to `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

#### Hover effect refinements

| Selector | Change |
|----------|--------|
| `.chapter-card` transition | Duration 0.15s → 0.18s; added `ease` to `border-color` |
| `.chapter-card:hover` | Changed to `:hover:not(:disabled)`; shadow reduced from `0 22px 50px rgba(0,0,0,0.7)` to `0 8px 24px rgba(0,0,0,0.35)` |
| `.stage-card:hover` | Changed to `:not(:disabled):hover`; shadow reduced from `0 14px 30px rgba(0,0,0,0.6)` to `0 6px 16px rgba(0,0,0,0.3)` |
| `.sidebar-pill:hover` | Changed to `:not(:disabled):hover`; added `transform: translateX(2px)` |

#### New BottomBar CSS classes

| Class | Purpose |
|-------|---------|
| `.bottombar` | 56px fixed-height bar, dark translucent background, top border, flex layout |
| `.bottombar-left` | 13px grey text row, flex with 16px gap |
| `.bottombar-right` | Flex row for action buttons, 8px gap |
| `.btn-small` | Base style for compact buttons: `padding: 7px 16px`, 13px 500-weight, 8px border-radius |
| `.btn-outline` | Light-blue tinted outline button (`rgba(125,211,252,…)`) |
| `.btn-outline:hover:not(:disabled)` | Increased background and border opacity on hover |
| `.btn-outline:disabled` | 40% opacity, `cursor: not-allowed` |

---

## Change Log — Narrative System

**Date:** 2026-03-30

### Overview

Introduced a narrative layer on top of the existing game mechanics: organisation profiles on the map view, player job titles, promotion cutscenes when unlocking Level 3/4, per-stage mission briefings, and turn feedback messages in the BottomBar.

---

### New file: `src/data/narrative.ts`

Pure data module — no game logic.

#### Interfaces

| Interface | Fields | Purpose |
|-----------|--------|---------|
| `OrgProfile` | `orgName`, `orgNameZh`, `orgType`, `orgTypeZh`, `tagline`, `taglineZh` | Fictional client organisation shown on the map and chapter cards |
| `PromotionEvent` | `unlockedLevel`, `managerQuote`, `managerQuoteZh`, `timeSkip`, `timeSkipZh`, `newTitle`, `newTitleZh` | Narrative cutscene data triggered when a new level is unlocked |

#### Exports

| Export | Type | Content |
|--------|------|---------|
| `ORG_PROFILES` | `Record<2\|3\|4, OrgProfile>` | L2: Meridian Retail Group / L3: Eastbridge General Hospital / L4: National Grid Operations Centre |
| `PROMOTION_EVENTS` | `Partial<Record<3\|4, PromotionEvent>>` | Manager quotes and time-skip text for Level 3 and Level 4 unlock moments |
| `PLAYER_TITLES` | `Record<number, {en,zh}>` | Index 0–2: Junior Security Consultant → Security Consultant → Senior Security Consultant |
| `getPlayerTitle(completedLevels)` | `function` | Returns the appropriate title object based on how many chapters have been completed |

---

### `src/data/stageData.ts`

`StageConfig` interface extended with two optional fields:

```typescript
briefing?: string;    // narrative mission brief (English)
briefingZh?: string;  // narrative mission brief (Chinese)
```

All 11 `StageConfig` objects now include `briefing` and `briefingZh` strings providing in-universe context for each scenario.

---

### `src/App.tsx`

#### New imports

```typescript
import { ORG_PROFILES, PROMOTION_EVENTS, getPlayerTitle } from "./data/narrative";
```

#### New state variables

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `briefingOpen` | `boolean` | `true` | Controls whether the Mission Brief panel in Stage view is expanded |
| `feedbackMsg` | `string \| null` | `null` | Feedback message passed to BottomBar after each turn |
| `promotionLevel` | `3 \| 4 \| null` | `null` | Triggers the promotion cutscene overlay when set |

#### `briefingOpen` reset

`setBriefingOpen(true)` is called inside `handleStageClick` so the briefing panel is always expanded when entering a stage.

#### `handleNextTurn` — feedback message

After scoring, if any High-severity threats remain unmitigated (`h > 0`), a context-aware warning is composed:
- Finds the first unmitigated High threat by name (bilingual)
- Sets `feedbackMsg` to a bilingual string naming the threat and explaining the client cannot sign off
- If no High threats remain unmitigated, `feedbackMsg` is set to `null`

#### Promotion cutscene `useEffect`

Runs when `view` changes to `"map"` or `completedChapters` changes:

```typescript
useEffect(() => {
    if (view.type !== "map") return;
    if (completedChapters.has(3) && !localStorage.getItem("seenPromotion_4")) {
        setPromotionLevel(4);
    } else if (completedChapters.has(2) && !localStorage.getItem("seenPromotion_3")) {
        setPromotionLevel(3);
    }
}, [view, completedChapters]);
```

The seen-state is persisted via `localStorage.setItem("seenPromotion_${level}", "1")` when the player clicks Continue.

#### Map view — TopBar player title

```tsx
<div className="top-bar-role">
    {t(playerTitle.en, playerTitle.zh)} · Sentinel Advisory
</div>
```

`playerTitle` is computed from `getPlayerTitle(completedLevelCount)` where `completedLevelCount` counts entries in `completedChapters`.

#### Map view — Chapter card organisation display

Each chapter card now shows the client organisation name and type beneath the level title:

```tsx
<div className="chapter-org-name">{t(ORG_PROFILES[chapter.id].orgName, ORG_PROFILES[chapter.id].orgNameZh)}</div>
<div className="chapter-org-type">{t(ORG_PROFILES[chapter.id].orgType, ORG_PROFILES[chapter.id].orgTypeZh)}</div>
```

#### Map view — Promotion cutscene overlay

Rendered conditionally when `promotionLevel` is non-null, layered above the map:

```tsx
{promotionLevel && (
    <div className="promotion-overlay">
        <div className="promotion-panel">
            <div className="promotion-time-skip">…</div>
            <div className="promotion-title-new">…</div>
            <div className="promotion-divider" />
            <blockquote className="promotion-quote">"…"</blockquote>
            <p className="promotion-attribution">— Your Manager, Sentinel Advisory</p>
            <button className="promotion-confirm" onClick={…}>Continue</button>
        </div>
    </div>
)}
```

#### Chapter view — score warning

When `(100 - currentScore) > 15`, a red inline note is shown beneath the score:

> "Some threats remain unmitigated — consider revisiting earlier stages."

#### Stage view — Mission Brief panel

Rendered immediately before the main content area when `stageConfig.briefing` exists:

```tsx
<div className={`stage-briefing ${briefingOpen ? "" : "stage-briefing-collapsed"}`}>
    <div className="stage-briefing-header" onClick={() => setBriefingOpen(p => !p)}>
        <span className="stage-briefing-label">Mission Brief</span>
        <span className="stage-briefing-toggle">{briefingOpen ? "▲" : "▼"}</span>
    </div>
    {briefingOpen && (
        <p className="stage-briefing-text">
            {language === "zh" && stageConfig.briefingZh ? stageConfig.briefingZh : stageConfig.briefing}
        </p>
    )}
</div>
```

#### `goBackToChapter` helper

Extracted from inline logic; additionally calls `setFeedbackMsg(null)` to clear any lingering turn feedback when leaving a stage.

---

### `src/components/BottomBar.tsx`

`BottomBarProps` extended with:

```typescript
feedbackMsg?: string | null;
```

When `feedbackMsg` is truthy, a warning line is rendered between the left stats and the right buttons:

```tsx
{feedbackMsg && (
    <div className="bottombar-feedback">
        ⚠ {feedbackMsg}
    </div>
)}
```

---

### `src/App.css`

#### New CSS classes

| Class | Purpose |
|-------|---------|
| `.top-bar-role` | 12px muted subtitle below the game title in TopBar |
| `.chapter-org-name` | 13px semi-bold organisation name on chapter cards |
| `.chapter-org-type` | 11px muted organisation type label |
| `.stage-briefing` | Dark bordered box for the Mission Brief panel, `margin-bottom: 12px` |
| `.stage-briefing-collapsed` | Removes bottom padding when collapsed |
| `.stage-briefing-header` | Flex row with cursor pointer; hover lightens background |
| `.stage-briefing-label` | 12px uppercase tracking label ("Mission Brief") |
| `.stage-briefing-toggle` | 10px grey chevron indicator |
| `.stage-briefing-text` | 13px body text, 1.6 line-height, muted colour |
| `.bottombar-feedback` | Centred amber warning text (`#fbbf24`), 12px, flex `1` |
| `.promotion-overlay` | Full-screen fixed backdrop (`rgba(0,0,0,0.85)`), z-index 200 |
| `.promotion-panel` | Centred card, max-width 480px, dark background, rounded corners |
| `.promotion-time-skip` | 12px uppercase spaced grey time-jump label |
| `.promotion-title-new` | 22px bold new job title |
| `.promotion-divider` | 1px horizontal rule separator |
| `.promotion-quote` | Italic blockquote in amber (`#fbbf24`), larger font |
| `.promotion-attribution` | 12px right-aligned grey attribution line |
| `.promotion-confirm` | Full-width confirm button, light-blue outline style |
| `.promotion-confirm:hover` | Increased background opacity on hover |

---

## Change Log — Client Rebrand, Briefing Rewrite, Intro Animation

**Date:** 2026-04-01

### Overview

Three coordinated changes: (1) renamed all fictional clients and the consultancy brand; (2) rewrote every stage mission briefing with richer prose tied to the new client identities; (3) added a full-screen intro sequence that plays on first launch and can be skipped.

---

### `src/data/narrative.ts`

#### Consultancy rename

All occurrences of "Sentinel Advisory" replaced with **"Kryuger Security"** (affects `App.tsx` display strings; the string does not appear in `narrative.ts` directly).

#### `ORG_PROFILES` — replaced

| Level | Old name | New name | Notes |
|-------|----------|----------|-------|
| 2 | Meridian Retail Group | **Singularity** | Tagline updated to "800 employees · Level 2 assessment" |
| 3 | Eastbridge General Hospital | **Polarized Light** | Tagline updated to "Regional healthcare · Level 3 assessment" |
| 4 | National Grid Operations Centre | **Convolutional Kernel** | Org type changed to "Classification: Restricted"; tagline simplified |

#### `PROMOTION_EVENTS` — replaced

Manager quotes updated to reference the new client names (Singularity / Polarized Light). Level 4 quote rewritten to be deliberately vague, matching the restricted nature of the Convolutional Kernel engagement.

#### New export: `INTRO_LINES`

```typescript
export const INTRO_LINES: { en: string; zh: string }[] = [ … ]
```

14 entries (including blank spacer lines). Content: sets the scene in Nottingham 2026, introduces Kryuger Security, establishes the player's starting role as Junior Security Consultant, and names the first client. Ends with "Time to get to work." / "该开始工作了。"

---

### `src/data/stageData.ts`

All 11 `briefing` / `briefingZh` fields rewritten. Changes per stage:

| Stage | Key change |
|-------|-----------|
| L2-1 | References Singularity; prose expanded to three-beat incident pattern ("someone clicked… then another… then a third") |
| L2-2 | References Singularity; enumerates specific account types (former contractors, seasonal staff, 2023 logistics partner) |
| L2-3 | References Singularity; lists data categories and adds insider threat framing |
| L2-4 | References Singularity; expands on device types (POS, scanners, laptops, guest Wi-Fi) |
| L3-1 | References Polarized Light; adds deliberate timing detail (started two weeks before system migration) |
| L3-2 | References Polarized Light; adds timeline (18 months ago migration, post-migration audit gap) |
| L3-3 | References Polarized Light; shifts from EHR framing to "data that does not expire"; adds next-of-kin detail |
| L3-4 | References Polarized Light; attributes network sprawl to facilities team adding devices without IT |
| L4-1 | References Convolutional Kernel by codename; sparse briefing is described as "deliberate"; removes nation-state attribution language |
| L4-2 | Removes grid/telemetry framing; focuses on consequences of data manipulation rather than the infrastructure type |
| L4-3 | Reframes as pure reconnaissance detection; "they are mapping" framing replaces "sophisticated intrusion attempt" |

---

### `src/App.tsx`

#### Import update

```typescript
import { ORG_PROFILES, PROMOTION_EVENTS, getPlayerTitle, INTRO_LINES } from "./data/narrative";
```

#### New state variables

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `showIntro` | `boolean` | `!localStorage.getItem("seenIntro")` | Whether to show the intro sequence |
| `introLineIndex` | `number` | `0` | How many lines have been revealed so far |
| `introReady` | `boolean` | `false` | Whether the Begin button should appear |

#### New `useEffect` — intro ticker

Runs whenever `showIntro` or `introLineIndex` changes:
- If lines remain: schedules a `setTimeout` (300ms for blank lines, 700ms for text lines) to increment `introLineIndex`
- Once all lines shown: schedules a 1000ms delay then sets `introReady = true`
- Returns cleanup to cancel the timer on re-render

#### New handler: `dismissIntro`

```typescript
const dismissIntro = () => {
    try { localStorage.setItem("seenIntro", "1"); } catch {}
    setShowIntro(false);
};
```

Persists the seen-state so the intro does not replay on refresh.

#### Intro rendering (new top-level branch, before all view branches)

```tsx
if (showIntro) {
    return (
        <div className="intro-overlay">
            <button className="intro-skip" onClick={dismissIntro}>…</button>
            <div className="intro-content">
                {INTRO_LINES.slice(0, introLineIndex).map((line, i) => (
                    <div key={i} className={`intro-line${line.en === "" ? " intro-line-spacer" : ""}`}>
                        {language === "zh" ? line.zh : line.en}
                    </div>
                ))}
            </div>
            {introReady && (
                <button className="intro-begin" onClick={dismissIntro}>…</button>
            )}
        </div>
    );
}
```

Blank lines render as `.intro-line-spacer` (fixed height, no fade animation). The Begin button appears only after all lines have been shown and the 1-second pause has elapsed.

#### "Sentinel Advisory" → "Kryuger Security"

Two occurrences replaced in the map view JSX:
- TopBar role line: `{playerTitle} · Kryuger Security`
- Promotion panel attribution: `— Your Manager, Kryuger Security`

---

### `src/App.css`

New section appended: `/* ─── Intro Overlay ──────────────────────────────────────────────────────── */`

| Class / Rule | Purpose |
|---|---|
| `.intro-overlay` | Full-screen fixed container, `z-index: 3000`, near-black background (`#020308`), centred flex column |
| `.intro-skip` | Absolute top-right button; transparent, muted grey; hover lightens border and text |
| `.intro-content` | Max 480px centred column, `gap: 2px` between lines |
| `.intro-line` | 15px, `#9ca3af`, `opacity: 0` → animated in via `introFadeIn` |
| `.intro-line:first-child` | Overridden to `#e5e7eb`, 600 weight, 16px (location/year line) |
| `.intro-line:last-child` | Overridden to `#7dd3fc`, 500 weight (closing CTA line) |
| `.intro-line-spacer` | Fixed 12px height, `opacity: 1 !important`, no animation |
| `.intro-begin` | Light-blue outline button, 48px top margin, fades in via `introFadeIn` with 0.6s duration |
| `.intro-begin:hover` | Increased background and border opacity |
| `@keyframes introFadeIn` | `opacity: 0; translateY(4px)` → `opacity: 1; translateY(0)` |

---

## Change Log — Ending Animation

**Date:** 2026-04-01
**Commit:** `dff0a36`

### Overview

Added a full-screen ending sequence that plays once when the player has completed all three chapters (Level 2, 3, and 4). Mirrors the intro animation in structure, but uses slower pacing and a distinct final line style.

---

### `src/data/narrative.ts`

New export `ENDING_LINES`:

```typescript
export const ENDING_LINES: { en: string; zh: string }[] = [ … ]
```

15 entries (including blank spacer lines). Narrates the conclusion of the Convolutional Kernel engagement, the manager's summary ("Three clients. Three assessments. No breaches on our watch."), and the arrival of a new file for a client codenamed "Quantum Fluctuations". Ends with "To be continued." / "待续。"

---

### `src/App.tsx`

#### Import update

`ENDING_LINES` added to the narrative import.

#### New state variables

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `showEnding` | `boolean` | `false` | Whether the ending sequence is active |
| `endingLineIndex` | `number` | `0` | How many lines have been revealed |
| `endingReady` | `boolean` | `false` | Whether the Return to Menu button should appear |

#### New `useEffect` — ending trigger

Runs when `view` returns to `"map"` or `completedChapters` changes. If all three chapters are present in `completedChapters` and `localStorage` has no `"seenEnding"` key, triggers the ending via `setTimeout(() => setShowEnding(true), 0)`.

#### New `useEffect` — ending ticker

Runs whenever `showEnding` or `endingLineIndex` changes:
- If lines remain: schedules a `setTimeout` (400ms for blank lines, 900ms for text lines) to increment `endingLineIndex`
- Once all lines shown: schedules a 1200ms delay then sets `endingReady = true`

#### New handler: `dismissEnding`

Writes `"seenEnding"` to `localStorage`, sets `showEnding` to `false`, and resets `endingLineIndex` and `endingReady` to their initial values.

#### Ending rendering (new branch between intro and map)

```tsx
if (showEnding) {
    return (
        <div className="ending-overlay">
            <button className="intro-skip" onClick={dismissEnding}>…</button>
            <div className="intro-content">
                {ENDING_LINES.slice(0, endingLineIndex).map((line, i) => (
                    <div key={i} className={`intro-line${…}${i === ENDING_LINES.length - 1 ? " ending-line-final" : ""}`}>
                        {language === "zh" ? line.zh : line.en}
                    </div>
                ))}
            </div>
            {endingReady && (
                <button className="intro-begin" onClick={dismissEnding}>
                    {language === "zh" ? "返回主菜单" : "Return to Menu"}
                </button>
            )}
        </div>
    );
}
```

The last line ("To be continued.") receives the `ending-line-final` class for a distinct amber colour.

---

### `src/App.css`

New section appended: `/* ─── Ending Overlay ─────────────────────────────────────────────────────── */`

| Class | Purpose |
|-------|---------|
| `.ending-overlay` | Full-screen fixed container identical in layout to `.intro-overlay` |
| `.ending-line-final` | Amber (`#f59e0b`) bold 16px style for the "To be continued." line |

---

## Change Log — ESLint setState-in-Effect Fixes

**Date:** 2026-04-01
**Commit:** `ea204f0`

### Overview

The ESLint rule `react-hooks/set-state-in-effect` flags any synchronous `setState` call directly in an effect body. Three new violations were introduced by the ending/promotion effects and the data-loading effect reset; two pre-existing empty `catch` blocks also triggered `no-empty`.

---

### `src/App.tsx`

| Location | Fix applied |
|----------|------------|
| `setBriefingOpen(true)` in data-loading effect | Wrapped in `setTimeout(..., 0)` |
| `setShowEnding(true)` in ending-trigger effect | Wrapped in `setTimeout(..., 0)` |
| `setPromotionLevel(3/4)` in promotion effect | Wrapped in `setTimeout(..., 0)` |
| Empty `catch {}` in `dismissIntro` | Changed to `catch { /* ignore */ }` |
| Empty `catch {}` in `dismissEnding` | Changed to `catch { /* ignore */ }` |

Wrapping in `setTimeout` defers the state update to after the current effect finishes, breaking the synchronous call chain that the rule flags. Functional behaviour is unchanged.

---

## Change Log — Narrative System Audit and Fixes

**Date:** 2026-04-01
**Commit:** `a1e71b9`

### Overview

Full audit of all narrative features against a specification checklist. Six issues found and corrected in one commit.

---

### Issues fixed

#### 1. Ending animation delays (spec mismatch)

The ending ticker used the same delay values as the intro (300ms / 700ms / 1000ms). Updated to the intended slower pacing:

| Delay | Before | After |
|-------|--------|-------|
| Blank line | 300ms | 400ms |
| Text line | 700ms | 900ms |
| "Return to Menu" button appearance | 1000ms | 1200ms |

#### 2. Ending and promotion cutscene simultaneous trigger

When a player completes Level 4 for the first time, both the ending sequence (`seenEnding` absent) and the Level 4 promotion cutscene (`seenPromotion_4` absent) were triggered together, producing two overlapping overlays.

**Fix:** The promotion `useEffect` now checks for a pending ending sequence before running:

```typescript
const allDone = completedChapters.has(2) && completedChapters.has(3) && completedChapters.has(4);
if (allDone && !localStorage.getItem("seenEnding")) return;
```

The ending sequence is shown first; the promotion cutscene fires on the next map visit (after the ending has been dismissed and `seenEnding` is written).

#### 3. Missing `ending-line-final` class on "To be continued." line

The last line of the ending was not visually distinguished from the other text lines.

**Fix:** The rendering loop now appends `ending-line-final` to the last element (`i === ENDING_LINES.length - 1`), applying the amber colour defined in CSS.

#### 4. Ending overlay reusing `intro-overlay` class

The ending used `<div className="intro-overlay">`, sharing the intro's CSS rather than having its own selector.

**Fix:** Changed to `<div className="ending-overlay">` and added a dedicated `.ending-overlay` rule in `App.css`.

#### 5. Missing Lv.5 "Quantum Fluctuations" coming-soon card

The map view rendered only the three playable chapter cards. The Lv.5 card referenced in `ENDING_LINES` had no visual representation.

**Fix:** A non-interactive `<div>` card added after the `CHAPTERS.map()` block:

```tsx
<div className="chapter-card chapter-card-coming-soon">
    <div className="chapter-icon chapter-icon-coming-soon">Lv.5</div>
    <div className="chapter-text-main">Quantum Fluctuations</div>
    <div className="chapter-text-sub">{t("Coming Soon", "即将推出")}</div>
</div>
```

#### 6. Four CSS classes missing from `App.css`

`ending-overlay`, `ending-line-final`, `chapter-card-coming-soon`, and `chapter-icon-coming-soon` were referenced in JSX but not defined in any stylesheet.

**Fix:** All four added to `App.css`:

| Class | Purpose |
|-------|---------|
| `.ending-overlay` | Full-screen overlay for the ending sequence |
| `.ending-line-final` | Amber bold style for the final "To be continued." line |
| `.chapter-card-coming-soon` | Dashed border, 45% opacity, `pointer-events: none` |
| `.chapter-icon-coming-soon` | Dark grey level indicator for the locked future card |

---

## Change Log — Comment Rewrite (Student-level Language)

**Date:** 2026-04-01
**Commit:** `869aab9`

### Overview

Code comments across four source files were rewritten to remove engineering-specific terminology and use plain language appropriate for an undergraduate project submission.

---

### Files changed and comments rewritten

#### `src/App.tsx` — 6 comments

| Before | After |
|--------|-------|
| `// --- Helpers (mirrored from Layout.tsx) ---` | `// Helper functions used across the game` |
| `/** Map a control's category to the sector it logically protects. */` | `/** Work out which sector a security control belongs to. */` |
| `// Tracks which stageId has finished loading — derived dataLoading avoids sync setState in effect` | `// Remember which stage and language were last loaded, so we know when to fetch new data` |
| `// Completion check — compute new deployed set synchronously` | `// Check if this deployment completes the stage` |
| `// L4: all scenario subThreatIds mitigated; L2/L3: all requiredControlIds deployed` | `// Level 4 stages pass when the whole attack chain is blocked; Level 2/3 pass when all required controls are deployed` |
| `// If this deploys completed the stage, check if all chapter stages are now done` | `// If the stage is now complete, check whether all stages in the chapter are also done` |

#### `src/data/narrative.ts` — 1 comment

| Before | After |
|--------|-------|
| `/** Infer player rank from the number of completed chapters. */` | `/** Return the player's job title based on how many chapters they have completed. */` |

#### `src/data/stageData.ts` — 1 comment

| Before | After |
|--------|-------|
| `// subThreatIds drive threat-tree logic; L4-IAM-01/02 are standalone stage threats.` | `// The threat tree uses linked sub-threats; L4-IAM-01/02 are extra standalone threats also shown in the stage.` |

#### `src/utils/dataLoader.ts` — 2 JSDoc blocks

Column-listing JSDoc blocks for `loadControls` and `loadThreats` replaced with shorter descriptions explaining which file is chosen and where the column index comments are.
