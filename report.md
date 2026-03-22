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
