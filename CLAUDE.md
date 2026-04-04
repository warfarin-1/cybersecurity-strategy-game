# CLAUDE.md — Cybersecurity Strategy Game
> 本文件是为 Claude AI 准备的项目全景指南，用于在任意会话中快速理解项目背景、架构、进度与下一步方向。

---

## 1. 项目概述

| 字段 | 内容 |
|------|------|
| 课程 | COMP3003 本科毕业项目（大三） |
| 项目名 | Cybersecurity Strategy Game |
| 目标 | 通过回合制策略游戏，教授玩家网络安全决策与风险管理概念 |
| 框架参考 | NCSC CAF（Cyber Assessment Framework）成熟度等级 |
| 开发阶段 | **功能完整阶段** — L2/L3/L4 全部可玩，双语支持，待用户测试 |

---

## 2. 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 前端框架 | React | 19.2.0 |
| 语言 | TypeScript | 5.9.3（strict 模式） |
| 构建工具 | Vite (rolldown-vite) | 7.2.5 |
| 样式 | 纯 CSS（无框架） | — |
| 包管理 | npm | — |
| 运行环境 | 浏览器，ES2022 | — |

启动命令：
```bash
npm run dev      # 开发服务器（HMR）
npm run build    # TypeScript 检查 + Vite 构建
npm run preview  # 预览构建产物
npm run lint     # ESLint 检查
```

---

## 3. 目录结构

```
cybersecurity_strategy_game/
├── src/
│   ├── App.tsx                  ← 主应用（导航 + 游戏逻辑 + GlossaryPanel）
│   ├── App.css                  ← 全局深色主题样式
│   ├── main.tsx                 ← React 入口（渲染 App）
│   ├── index.css                ← 补充样式
│   ├── types.ts                 ← 全局 TypeScript 类型定义
│   ├── data/
│   │   ├── stageData.ts         ← 11 个 Stage 的完整配置（StageConfig）
│   │   └── narrative.ts         ← 叙事数据（OrgProfile、PromotionEvent、玩家职称）
│   ├── utils/
│   │   └── dataLoader.ts        ← 异步 CSV/JSON 数据加载器（支持双语）
│   └── components/
│       ├── BottomBar.tsx        ← 底部回合控制栏（含 language prop）
│       ├── Layout.tsx           ← 早期原型遗留（未被 main.tsx 引用）
│       ├── TopBar.tsx           ← 早期原型遗留
│       ├── SidebarControls.tsx  ← 早期原型遗留
│       ├── CommandCenter.tsx    ← 早期原型遗留
│       └── StatusPanel.tsx      ← 早期原型遗留
├── public/
│   └── data/
│       ├── controls_library_level2_4.csv           ← 41 个控制（英文）
│       ├── controls_library_level2_4_bilingual.csv ← 41 个控制（中英双语）
│       ├── level2_threats.csv                      ← L2 威胁（英文）
│       ├── level2_threats_bilingual.csv            ← L2 威胁（中英双语）
│       ├── level3_threats.csv
│       ├── level3_threats_bilingual.csv
│       ├── level4_threats.csv                      ← 26 行（含 C 系列 sub-threat）
│       ├── level4_threats_bilingual.csv
│       ├── level4_threat_trees.json                ← 3 个 L4 Scenario（英文）
│       └── level4_threat_trees_bilingual.json      ← 3 个 L4 Scenario（中英双语）
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json / tsconfig.app.json / tsconfig.node.json
```

---

## 4. 导航架构（App.tsx）

游戏有三层视图，通过 `View` 类型的 state 切换：

```
View: "map" → "chapter" → "stage"
```

### 4.1 View 类型定义

```typescript
type View =
  | { type: "map" }
  | { type: "chapter"; chapter: ChapterLevel }   // ChapterLevel = 2 | 3 | 4
  | { type: "stage"; chapter: ChapterLevel; stageId: string };
```

### 4.2 关卡结构（全部已定义）

```
Level 2 — Basic Protection（基础保护）
  L2-1: Phishing Basics          — 初级社会工程风险
  L2-2: Identity & Access        — 密码和账户控制
  L2-3: Data Handling            — 简单数据集存储与共享
  L2-4: Network Hygiene          — 基础网络与设备安全

Level 3 — Critical Business（关键业务）
  L3-1: Targeted Phishing        — 更真实的鱼叉式网络钓鱼
  L3-2: Cloud Identity           — 跨 SaaS 服务的账户管理
  L3-3: Data at Scale            — 大型数据集与访问控制
  L3-4: Network Exposure         — 面向互联网的系统与日志

Level 4 — Key Infrastructure（关键基础设施）
  L4-1: High-Risk Identity Chain — 组合 IAM 弱点（Scenario: L4-B2-SCENARIO-01）
  L4-2: Large Data Exposure      — 威胁树式数据泄露（Scenario: L4-B3-SCENARIO-01）
  L4-3: Critical Service Compromise — 基础设施级事件（Scenario: L4-B4-SCENARIO-01）
```

### 4.3 Map 视图（关卡选择页）

- Chapter 卡片：顺序解锁，完成后显示 ✓ Completed
- 📖 Glossary 按钮：打开网络安全图鉴面板
- ⚙ Settings 按钮：打开 Settings 面板（含 Game Mode / Language / Theme / Reset Progress 四个区块）
- 游戏模式切换、语言切换、主题切换均移入 Settings 面板，地图页主区域只显示章节卡片

### 4.4 Chapter 视图（阶段选择页）

Control Room 4 个面板全部接入真实数据：
- Known Security Measures（完成 Stage 后的已知控制）
- Known Threat Types（当前章节威胁类型标签）
- Budget Overview（总预算/剩余/已用）
- Score & Deductions（当前分数 / 通关分数 / 进展状态）

Stage Grid：显示 Risk Type 标签、Status 标签（含锁定/完成/进行中/未开始）

### 4.5 Stage 视图（阶段游戏页）

三列布局：
- **左侧**：Security Measures（控制按钮，Beginner 模式显示 ⭐ 推荐标记）
- **中央**：`stage-main-board`
  - **L2/L3**：Threat Status 面板（所有威胁的缓解状态，Beginner 显示 Hint）
  - **L4**：Threat Tree 面板（攻击链节点，子威胁缓解状态，Beginner 显示部署提示）
- **右侧**：Security Requirements（✓/✗ 状态）+ Threats 侧栏

---

## 5. 游戏逻辑层（App.tsx）

### 5.1 数据结构（types.ts）

```typescript
export type RiskLevel = "Low" | "Medium" | "High";

export interface Sector {
    id: string;
    name: string;
    controlsApplied: number;
    riskLevel: RiskLevel;
}

export interface GameState {
    turn: number;
    budget: number;
    sectors: Sector[];
    logs: string[];
}

export type StageStatus = "not_started" | "in_progress" | "completed";

export interface StageGameState {
    stageId: string;
    status: StageStatus;
    turn: number;
    budget: number;
    sectors: Sector[];
    logs: string[];
    isCompleted: boolean;
    deployedControlIds: string[];
}

export interface ChapterState {
    chapterId: number;
    totalBudget: number;
    remainingBudget: number;
    score: number;
    stageStates: Record<string, StageGameState>;
}
```

### 5.2 全局状态（App.tsx）

| State | 类型 | 说明 |
|-------|------|------|
| `view` | `View` | 当前视图（map/chapter/stage） |
| `chapterState` | `ChapterState \| null` | 当前章节状态（含所有 Stage） |
| `completedChapters` | `Set<number>` | 已完成章节，持久化 localStorage |
| `activeStageState` | `StageGameState \| null` | 当前 Stage 游戏状态 |
| `stageThreats` | `Threat[]` | 当前 Stage 威胁列表（异步加载） |
| `stageControls` | `Control[]` | 当前 Stage 控制列表（异步加载） |
| `deployedControlIds` | `string[]` | 已部署控制 ID 列表 |
| `level4Scenario` | `Level4Scenario \| null` | L4 场景数据（含 subThreatIds） |
| `gameMode` | `"beginner" \| "expert"` | 游戏模式，持久化 localStorage |
| `language` | `"en" \| "zh"` | 当前语言，持久化 localStorage |
| `glossaryOpen` | `boolean` | 词汇表面板开关 |
| `settingsOpen` | `boolean` | Settings 面板开关 |
| `theme` | `"dark" \| "light"` | UI 主题，持久化 localStorage；`useEffect` 同步写 `document.documentElement` 的 `data-theme` 属性 |
| `briefingOpen` | `boolean` | Stage 任务简报折叠状态（默认展开） |
| `feedbackMsg` | `string \| null` | 回合结束时的反馈消息（由 BottomBar 接收） |
| `promotionLevel` | `3 \| 4 \| null` | 触发晋升弹窗的目标等级（解锁 L3/L4 时弹出） |
| `showIntro` | `boolean` | 控制首次启动的 intro 动画是否显示（读 localStorage 'seenIntro'） |
| `introLineIndex` | `number` | intro 已显示到第几行 |
| `introReady` | `boolean` | intro 全部显示完毕后是否显示 Begin 按钮 |
| `showEnding` | `boolean` | 控制全通关后的 ending 动画是否显示（读 localStorage 'seenEnding'） |
| `endingLineIndex` | `number` | ending 已显示到第几行 |
| `endingReady` | `boolean` | ending 全部显示完毕后是否显示 Return to Menu 按钮 |
| `showTutorial` | `boolean` | Tutorial 全屏弹窗开关；`true` 时在所有视图之前 early return 渲染独立全屏弹窗 |
| `tutorialIndex` | `number` | 当前显示的 Tutorial 卡片索引（0–4，共 5 张） |
| `tutorialDeployed` | `string[]` | Tutorial 弹窗内虚拟 Stage 已部署的 mock 控制 ID 列表；`openTutorial` 和 `closeTutorial` 均清空 |
| `forceTutorialSeen` | `boolean` | 标记教程已播放，防止自动重触发；读/写 `localStorage('seenTutorial')`，`closeTutorial` 写 true，Settings Replay 按钮写 false |
| `stageScoreDeducted` | `boolean` | 标记本关是否已在 `handleSubmitStage` 中结算过扣分，防止重复扣；进入新 Stage / 重置关卡时清空 |

### 5.3 初始扇区（4个）

| id | 名称 | 初始风险 |
|----|------|---------|
| physical | Physical Environment | High |
| boundary | Perimeter / Boundary | High |
| network | Network | High |
| computing | Computing Environment | High |

### 5.4 风险计算逻辑

```typescript
function calculateRiskLevel(controlsApplied: number): RiskLevel {
    if (controlsApplied >= 3) return "Low";
    if (controlsApplied >= 1) return "Medium";
    return "High";
}
```

### 5.5 提交与扣分逻辑（handleSubmitStage）

玩家完成部署后点击 **Submit** 触发，取代原来的 Next Turn 回合制：

1. **前置拦截**：若存在任何未缓解的 High 威胁，拒绝提交并显示反馈消息，不扣分。
2. **一次性扣分**（仅首次提交时，`stageScoreDeducted` 为 false 时执行）：
   - 未缓解 Medium 威胁：每个 **−15 分**
   - 未缓解 Low 威胁：每个 **−5 分**
   - High 威胁不单独扣分（已被前置拦截）
   - 扣分后将 `stageScoreDeducted` 置 true，防止再次扣分
3. **分数检查**：若扣分后 `chapterState.score < config.passingScore`，拒绝通关并提示，但扣分已生效。
4. **通关**：High 全解决 + 分数达标 → `status = "completed"`，`isCompleted = true`，触发章节解锁检查。

威胁缓解判定：`threat.recommendedControlIds.some(id => deployedControlIds.includes(id))`

### 5.6 通关判定

通关由 `handleSubmitStage` 统一触发（**不再**在 `handleDeployControl` 里自动检测）：

**L2/L3/L4 统一流程**：所有 High 威胁缓解 + 提交后章节分数 ≥ `passingScore` → 标记 `"completed"`

> 注：L4 的 High 威胁均为 Scenario 子威胁节点；缓解判定逻辑与 L2/L3 相同，不再单独走 `allSubThreatsMitigated` 路径。

### 5.7 数据加载（dataLoader.ts）

- `loadControls(lang?)` — 加载 controls CSV（英文或双语版本）
- `loadThreats(level, lang?)` — 加载对应 Level 的 threats CSV
- `loadLevel4Tree(lang?)` — 加载 L4 威胁树 JSON

`dataLoading` 标志：`view.type === "stage" && loadedForStageId !== \`${stageId}:${language}\``

语言切换后自动重新加载数据。

### 5.8 双语支持

- `t(en, zh)` helper：全局语言切换
- `controlName(c)` / `threatName(th)`：根据语言返回对应名称
- GlossaryPanel 内置独立的 `t()` helper
- 数据层通过文件名后缀 `_bilingual` 区分双语版本

### 5.9 localStorage Key 全量清单

| Key | 写入 | 读取 | 清除 | 备注 |
|-----|------|------|------|------|
| `completedChapters` | 章节完成时 | lazy init | Reset All | 游戏进度 |
| `chapterState_2` | chapterState useEffect | 进入章节时 | Reset All | 游戏进度 |
| `chapterState_3` | chapterState useEffect | 进入章节时 | Reset All | 游戏进度 |
| `chapterState_4` | chapterState useEffect | 进入章节时 | Reset All | 游戏进度 |
| `seenIntro` | intro 结束时 | lazy init | Reset All | 游戏进度 |
| `seenEnding` | ending 结束时 | 章节完成检查 | Reset All | 游戏进度 |
| `seenPromotion_3` | 晋升弹窗关闭时 | 晋升触发检查 | Reset All | 游戏进度 |
| `seenPromotion_4` | 晋升弹窗关闭时 | 晋升触发检查 | Reset All | 游戏进度 |
| `seenTutorial` | tutorial 关闭时 | lazy init | Replay Tutorial / Reset All | 游戏进度 |
| `gameMode` | Settings 切换时 | lazy init | **不清除**（保留用户设置） | 用户偏好 |
| `language` | Settings 切换时 | lazy init | **不清除**（保留用户设置） | 用户偏好 |
| `theme` | theme useEffect | lazy init | **不清除**（保留用户设置） | 用户偏好 |

> ⚠️ 注意：`chapterState_N` 是动态 key（每章独立存储），**不是**单一的 `chapterStates`。旧版 Reset All 错误地清除了不存在的 `chapterStates`，已于 2026-04-04 修复。

---

## 6. GlossaryPanel（网络安全图鉴）

内联于 `App.tsx`，在所有视图的 TopBar 均可访问。

**功能：**
- 搜索框：支持 ID、名称（中英文）、分类模糊搜索
- 两个标签页：Security Controls / Threats
- Controls 显示：controlId、category、cost、name、description、CAF Principle
- Threats 显示：threatId、severity、riskType、name、description、推荐控制 ID
- 无结果时显示空提示（"No results found." / "未找到相关结果。"）
- 点击 overlay 背景关闭面板

**数据来源：**加载全部 L2+L3+L4 威胁 + 全部 41 个控制，按当前语言加载。

---

## 7. 样式系统

`App.css` 使用 **CSS 自定义属性（变量）** 实现双主题；`index.css` 为补充样式。

### 主题变量体系

`:root`（深色默认）和 `[data-theme="light"]`（暖米色浅色）块定义全部颜色变量：

| 变量名 | 用途 |
|--------|------|
| `--bg-primary` / `--bg-secondary` / `--bg-card` / `--bg-card-hover` / `--bg-input` | 各层背景色 |
| `--border-color` / `--border-light` | 边框色 |
| `--text-primary` / `--text-secondary` / `--text-muted` / `--text-dim` | 文字层次 |
| `--accent-blue` / `--accent-orange` / `--accent-green` / `--accent-red` | 强调色 |
| `--topbar-bg` / `--overlay-bg` / `--shadow` | 特殊场景色 |

`intro-overlay` 和 `ending-overlay` 使用硬编码黑色（`#020308`），不受主题影响（电影感设计决策）。

### 关键 CSS 类

| 类名 | 用途 |
|------|------|
| `.app-root` | 全页面容器，深黑背景 |
| `.top-bar` | 顶部导航栏 |
| `.map-container` | Level 选择地图 |
| `.chapter-card` / `.chapter-card-locked` | 关卡选择卡片 |
| `.chapter-layout` | 章节视图（grid） |
| `.control-center` / `.control-room-box` | Control Room 面板 |
| `.stage-grid` | 阶段卡片网格 |
| `.stage-layout` | 阶段视图（三列 grid） |
| `.stage-sidebar-left` / `.stage-sidebar-right` | 侧边栏 |
| `.stage-main-area` / `.stage-main-board` | 中央主区域 |
| `.sidebar-pill` / `.sidebar-pill-danger` / `.sidebar-pill-success` | 侧边栏按钮 |
| `.control-recommended` | Beginner 模式推荐控制高亮 |
| `.threat-tree-panel` | L4 威胁树容器 |
| `.threat-node` / `.threat-node-mitigated` / `.threat-node-unresolved` | 威胁节点 |
| `.threat-hint` | Beginner 模式提示文字 |
| `.threat-status-panel` | L2/L3 威胁状态面板 |
| `.stage-status-success` / `.stage-status-warning` | 通关/警告横幅 |
| `.glossary-overlay` / `.glossary-panel` | 词汇表面板 |
| `.glossary-item` / `.glossary-tabs` / `.glossary-search` | 词汇表内部元素 |
| `.mode-selector` / `.mode-btn` / `.mode-btn-active` | 模式/语言切换按钮 |
| `.glossary-btn` | TopBar 图鉴按钮 |
| `.intro-overlay` / `.intro-skip` / `.intro-content` | Intro 动画全屏容器及内部元素 |
| `.intro-line` / `.intro-line-spacer` / `.intro-begin` | Intro 文字行及 Begin 按钮 |
| `.ending-overlay` / `.ending-line-final` | Ending 动画全屏容器及末行特殊样式 |
| `.chapter-card-coming-soon` / `.chapter-icon-coming-soon` | 地图页 Lv.5 待续卡片 |
| `.promotion-overlay` / `.promotion-panel` | 晋升弹窗 |
| `.promotion-time-skip` / `.promotion-title-new` / `.promotion-quote` | 晋升弹窗内容元素 |
| `.stage-briefing` / `.stage-briefing-header` / `.stage-briefing-text` | 任务简报折叠区块 |
| `.bottombar-feedback` | BottomBar 回合反馈消息 |
| `.settings-btn` | TopBar 设置按钮（⚙） |
| `.settings-overlay` / `.settings-panel` | Settings 弹窗遮罩及面板容器 |
| `.settings-header` / `.settings-section` | 面板标题与区块 |
| `.settings-option` / `.settings-option.active` | 设置选项按钮及选中状态 |
| `.settings-hint` / `.settings-reset-btn` | 区块提示文字及重置按钮 |
| `.stage-inner-reset-btn` | Stage 视图左侧底部关卡内重置按钮（虚线边框，hover 变红） |
| `.chapter-card-tutorial` / `.chapter-icon-tutorial` | 地图页 Tutorial 入口卡片（绿色渐变） |
| `.btn-green` | BottomBar 绿色"下一关"按钮变体 |
| `.score-rule-hint` | Security Requirements 标题下方橙色扣分规则说明（High/Medium/Low 扣分提示） |
| `.tutorial-fullscreen` | Tutorial 全屏独立弹窗容器（`position:fixed`，z-index 2000，两列布局） |
| `.tutorial-left-panel` | Tutorial 弹窗左侧说明区（卡片文字、进度点、导航按钮） |
| `.tutorial-right-panel` | Tutorial 弹窗右侧虚拟 Stage 预览区 |
| `.tutorial-mock-topbar` / `.tutorial-mock-topbar-title` / `.tutorial-mock-budget` | 虚拟 Stage 顶部信息栏及预算显示 |
| `.tutorial-mock-stage` | 虚拟 Stage 三列网格容器 |
| `.tutorial-mock-panel` / `.tutorial-mock-panel-highlight` / `.tutorial-mock-panel-title` | 虚拟 Stage 面板及高亮变体（当前卡片对应面板亮起） |
| `.tutorial-mock-control-row` / `.tutorial-mock-control-btn` / `.tutorial-mock-control-btn.recommended` / `.tutorial-mock-control-btn.deployed` | 虚拟控制按钮行及推荐/已部署状态 |
| `.tutorial-mock-cost` | 虚拟控制费用标签 |
| `.tutorial-mock-threat` / `.tutorial-mock-threat.mitigated` / `.tutorial-mock-threat.unresolved` | 虚拟威胁行及缓解/未解决状态 |
| `.tutorial-mock-threat-name` / `.tutorial-mock-severity` / `.tutorial-mock-threat-status` | 虚拟威胁名称、严重度标签、状态指示器 |
| `.tutorial-mock-req` / `.tutorial-mock-req.req-met` / `.tutorial-mock-req.req-unmet` | 虚拟 Security Requirements 行及满足/未满足状态 |
| `.tutorial-mock-score-hint` | 虚拟面板中的扣分规则提示 |
| `.tutorial-mock-bottombar` / `.tutorial-mock-bottombar-info` / `.tutorial-mock-submit` | 虚拟底部栏、预算信息及 Submit 按钮 |
| `.tutorial-arrow` | Tutorial 左右切换箭头按钮 |
| `.tutorial-dot` / `.tutorial-dot.active` / `.tutorial-dot.done` | 进度指示点 |
| `.tutorial-btn-primary` / `.tutorial-btn-secondary` / `.tutorial-skip` | Tutorial 导航按钮 |
| `.settings-reset-tutorial-btn` | Settings 面板内"重新播放教程"按钮（hover 变蓝） |

---

## 8. StageConfig 结构（stageData.ts）

```typescript
export interface StageConfig {
    stageId: string;
    stageName: string;
    chapter: 2 | 3 | 4;
    budgetAllocation: number;
    threatIds: string[];             // 出现的威胁 ID
    availableControlIds: string[];   // 侧栏显示的控制（含干扰项）
    requiredControlIds: string[];    // 必须部署才能通关（L2/L3 通关条件）
    passingScore: number;            // 最低通关分数
    briefing?: string;               // 叙事任务简报（英文），可选
    briefingZh?: string;             // 叙事任务简报（中文），可选
}
```

| Stage | Budget | 威胁数 | 控制数 | 必需控制数 | 通关分数 |
|-------|--------|--------|--------|-----------|---------|
| L2-1  | £200k  | 5      | 8      | 4         | 60      |
| L2-2  | £200k  | 4      | 8      | 4         | 60      |
| L2-3  | £200k  | 4      | 8      | 3         | 60      |
| L2-4  | £200k  | 4      | 8      | 3         | 60      |
| L3-1  | £250k  | 6      | 9      | 4         | 65      |
| L3-2  | £250k  | 6      | 9      | 4         | 65      |
| L3-3  | £250k  | 6      | 8      | 4         | 65      |
| L3-4  | £250k  | 6      | 9      | 4         | 65      |
| L4-1  | £300k  | 5      | 7      | 3         | 70      |
| L4-2  | £300k  | 5      | 7      | 3         | 70      |
| L4-3  | £300k  | 5      | 7      | 3         | 70      |

L4 的 `requiredControlIds` 对应 Scenario 的 `requiredControls`，通关条件为子威胁全部缓解（而非仅检查 `requiredControlIds`）。

---

## 9. 当前开发状态

### ✅ 已完成

**基础架构**
- [x] React 19 + TypeScript + Vite 项目骨架（strict 模式，零构建错误）
- [x] 三层导航系统（地图 → 章节 → 阶段），`View` 联合类型驱动
- [x] 全部 11 个关卡/阶段的 metadata 定义（`STAGES_BY_CHAPTER`）
- [x] 深色主题 UI 框架（`App.css`）
- [x] Git 版本控制

**数据层**
- [x] `src/utils/dataLoader.ts`：异步 CSV/JSON 加载器（`loadControls`、`loadThreats`、`loadLevel4Tree`），支持英文和双语版本
- [x] `public/data/`：41 个控制、L2/L3/L4 威胁 CSV（英文 + 双语）、L4 威胁树 JSON（英文 + 双语）
- [x] `src/data/stageData.ts`：11 个 Stage 的完整 `StageConfig`，`getStageConfig(stageId)` 查询接口

**L2 全部 Stage（完全可玩）**
- [x] L2-1 Phishing Basics：5 个威胁、8 个控制、4 个必需控制、passing score 60
- [x] L2-2 Identity & Access：4 个威胁、8 个控制、4 个必需控制、passing score 60
- [x] L2-3 Data Handling：4 个威胁、8 个控制、3 个必需控制、passing score 60
- [x] L2-4 Network Hygiene：4 个威胁、8 个控制、3 个必需控制、passing score 60

**L3 全部 Stage（完全可玩）**
- [x] L3-1 Targeted Phishing：6 个威胁（Medium×4 + High×2）、9 个控制、4 个必需控制、passing score 65
- [x] L3-2 Cloud Identity：6 个威胁、9 个控制、4 个必需控制、passing score 65
- [x] L3-3 Data at Scale：6 个威胁、8 个控制、4 个必需控制、passing score 65
- [x] L3-4 Network Exposure：6 个威胁、9 个控制、4 个必需控制、passing score 65

**L4 全部 Stage（完全可玩）**
- [x] L4-1 High-Risk Identity Chain：5 个威胁、7 个控制、3 个必需控制、passing score 70（Scenario: L4-B2-SCENARIO-01）
- [x] L4-2 Large Data Exposure：5 个威胁、7 个控制、3 个必需控制、passing score 70（Scenario: L4-B3-SCENARIO-01）
- [x] L4-3 Critical Service Compromise：5 个威胁、7 个控制、3 个必需控制、passing score 70（Scenario: L4-B4-SCENARIO-01）

**游戏机制**
- [x] **Submit Stage 流程**：取代原回合制；玩家部署完毕后点击 Submit，触发一次性结算
- [x] **扣分逻辑（一次性）**：首次提交时对未缓解 Medium×15 / Low×5 扣分；`stageScoreDeducted` 防重复扣
- [x] **High 威胁前置拦截**：存在未缓解 High 威胁时，Submit 被拒绝，不扣分，不通关
- [x] **分数通关门槛**：扣分后章节分数 ≥ `passingScore` 方可完成，否则提示并允许重置
- [x] 通关检测统一由 `handleSubmitStage` 触发（L2/L3/L4 逻辑一致，不再在部署时自动检测）
- [x] Stage 顺序解锁：`isStageUnlocked` 检查前序 Stage 完成状态
- [x] Chapter 顺序解锁：完成全章所有 Stage 后解锁下一级
- [x] `completedChapters` 持久化到 `localStorage`
- [x] `chapterState` 持久化到 `localStorage`（key: `chapterState_${chapterId}`）：刷新后进入章节可恢复所有 Stage 完成状态、已部署控制、剩余预算
- [x] `deployedControlIds` 持久化到 `StageGameState`（重新进入 Stage 恢复已部署状态）
- [x] `dataLoading` 保护：数据加载期间禁用 Submit 按钮；key 为 `${stageId}:${language}`（语言切换触发重新加载）

**难度模式**
- [x] **Beginner 模式**：Security Measures 侧栏显示 ⭐ 推荐标记；Threats 侧栏显示 "Hint: Deploy X"；L4 攻击链节点显示部署提示；中央 Threat Status 面板显示 Hint
- [x] **Expert 模式**：隐藏所有推荐关系，玩家需自行判断
- [x] 模式选择器移入 Settings 面板（原在地图视图主区域），持久化 localStorage

**双语支持（EN/ZH）**
- [x] 语言切换器移入 Settings 面板（English / 中文），持久化 localStorage
- [x] 全局 `t(en, zh)` helper 覆盖所有 UI 文本
- [x] 数据层支持双语 CSV/JSON（`_bilingual` 后缀文件）
- [x] 语言切换后自动重新加载当前 Stage 的威胁和控制数据

**Glossary（网络安全图鉴）面板**
- [x] 所有视图的 TopBar 均有 📖 按钮
- [x] 搜索框：ID / 名称（中英）/ 分类模糊搜索
- [x] 双标签：Security Controls（41 个）/ Threats（L2+L3+L4 全部）
- [x] 无结果时显示空状态提示
- [x] 支持双语显示，随当前语言切换

**控制撤回机制（Stage 视图）**
- [x] 已部署控制按钮旁显示 ↩ 撤回按钮（`handleUndoControl`）
- [x] 撤回后退款 `cost * 10_000`，同步更新 `chapterState.remainingBudget`
- [x] 撤回后 `isCompleted` 重置为 `false`，`status` 回到 `"in_progress"`
- [x] 撤回 log 支持双语（中文使用 `control.nameZh`）
- [x] 撤回不退还已扣分数（分数仅在整关重置时退还）

**关卡内重置（Stage 视图）**
- [x] `handleInnerReset`：有部署控制时，左侧面板底部显示 `↺ Reset This Stage` 按钮
- [x] 退还本关已花费预算；读取 `stageState.scoreDeducted` 精确退还已扣分数（修复旧版按当前部署重新计算导致的退分误差）
- [x] 重置后清空 `deployedControlIds`、恢复 `budget`、清除 `feedbackMsg`、`stageScoreDeducted` 置 false

**叙事系统（`src/data/narrative.ts`）**
- [x] `OrgProfile`：三个 Level 对应三家虚构组织（L2: Singularity 零售商 / L3: Polarized Light 医疗机构 / L4: Convolutional Kernel 限制级客户），含双语名称、行业类型、简介标语
- [x] `PromotionEvent`：解锁 L3/L4 时触发晋升弹窗，含经理台词、时间跳跃文本、新职称（双语）；已读状态通过 `localStorage` (`seenPromotion_${level}`) 持久化；结局动画触发时 ending 优先、升职延后
- [x] `PLAYER_TITLES` + `getPlayerTitle()`：按已完成章节数推算玩家职称（初级/安全/高级安全顾问），显示于地图视图 TopBar（"职称 · Kryuger Security"）
- [x] **Stage 任务简报（Mission Brief）**：每个 Stage 均配有叙事背景简报（`briefing` / `briefingZh`），显示于 Stage 视图顶部，可折叠展开（默认展开）
- [x] **提交反馈消息（feedbackMsg）**：`handleSubmitStage` 根据拦截原因或分数不足生成提示文本，通过 `feedbackMsg` prop 传入 BottomBar 显示
- [x] **Intro 动画**：`INTRO_LINES`（14行）首次启动时逐行显示，空行 300ms / 文字行 700ms，1000ms 后出现 Begin 按钮；`localStorage('seenIntro')` 持久化已读状态
- [x] **Ending 动画**：`ENDING_LINES`（15行）全通关后在地图视图触发，空行 400ms / 文字行 900ms，1200ms 后出现 Return to Menu 按钮；末行"To be continued."附 `ending-line-final` 琥珀色样式；`localStorage('seenEnding')` 持久化
- [x] **地图页 Lv.5 卡片**：显示"Quantum Fluctuations / Coming Soon"，使用 `chapter-card-coming-soon` 虚线样式，不可点击

**关卡重置机制（Chapter 视图）**
- [x] Stage 卡片在 `in_progress` / `completed` 状态下显示 ↺ Reset Stage 按钮（`handleResetStage`）
- [x] 重置退还已花费预算（`budgetAllocation - stageState.budget`），同步 `chapterState.remainingBudget`
- [x] 重置读取 `stageState.scoreDeducted` 精确退还已扣分数（修复旧版未退分的 bug，`types.ts` 新增 `scoreDeducted?: number` 字段）
- [x] 重置后 Stage 状态归零（budget/deployedControlIds/isCompleted/status/turn/logs/scoreDeducted）
- [x] 若当前 `activeStageState` 是该 Stage，同步清空 `deployedControlIds`
- [x] 若重置导致本章不再全部完成，从 `completedChapters` 及 `localStorage` 中移除该 chapter

**Settings 面板与主题切换**
- [x] TopBar 新增 ⚙ Settings 按钮（所有视图均可访问）
- [x] Settings 面板四区块：Game Mode / Language / Theme / Reset Progress（清除所有游戏进度 localStorage key，保留 gameMode/language/theme）
- [x] 地图主页面清理：移除 mode-selector、language-selector 及 mode-description，仅保留章节卡片
- [x] `theme` state（`"dark" | "light"`）+ `useEffect` 同步 `document.documentElement.setAttribute("data-theme", theme)`，持久化 localStorage
- [x] `App.css` 全面重构为 CSS 自定义属性（变量）体系，`:root`（深色）和 `[data-theme="light"]`（暖米色）双主题块
- [x] 浅色主题为暖米色调（`#e8e4de` 等），降低对比度刺眼感；intro/ending overlay 保持硬编码黑色（电影感）

**样式更新**
- [x] Inter 字体（Google Fonts）引入 `index.html`，全局 UI 字体统一
- [x] BottomBar 样式细化（间距、颜色层次）
- [x] 全局悬停效果精细化（按钮、卡片交互反馈）
- [x] 叙事相关新 CSS 类：`.stage-briefing` / `.stage-briefing-collapsed` / `.promotion-overlay` / `.promotion-panel` / `.promotion-quote` 等
- [x] 地图页章节卡片对比度修复：`.chapter-card` 背景提亮、`.chapter-text-main` 显式颜色、`.chapter-org-type` 提亮
- [x] Stage 视图字体放大：`.sidebar-pill` 12→13px、`.sidebar-title` 13→14px、`.threat-node-name` 13→14px、`.threat-node-severity` / `.threat-hint` 11→12px、`.stage-briefing-text` 12→13px、`.bottombar-left` / `.btn-small` 13→14px
- [x] 右侧 Requirements 栏 `.sidebar-pill-success` / `.sidebar-pill-danger` / `div.sidebar-pill` 移除 hover transform 与 cursor:pointer（纯展示，不可交互）
- [x] 已部署控制行 `.control-deployed-row .sidebar-pill` 绿色背景/边框高亮，`opacity:1`（视觉区分已部署 vs 未部署）
- [x] `.btn-green`：BottomBar 绿色"下一关"按钮
- [x] `.score-rule-hint`：Security Requirements 标题下橙色小字，提示 Medium/Low 未缓解扣分规则

**UI 组件**
- [x] Stage 三列布局（左：Security Measures / 中：内容区 / 右：Requirements + Threats）
- [x] Security Measures 侧栏：动态渲染控制按钮，已部署显示 ✓ 并 disabled
- [x] Security Requirements 侧栏：绿色 ✓ / 红色 ✗，显示控制全名（支持双语）
- [x] L2/L3 中央区域：Threat Status 面板（威胁名称、严重度、缓解状态、Beginner Hint）
- [x] L4 中央区域：Threat Tree 面板（Scenario 标题/描述、攻击链节点、缓解状态、Beginner 部署提示）
- [x] Control Room 4 个面板全部接入真实数据
- [x] Stage 卡片：Risk Type 标签、Status 标签（含锁定状态）
- [x] `stage-status-success` / `stage-status-warning` 横幅
- [x] BottomBar：Budget / Score / 通关状态实时显示，`isLoading` 禁用保护，支持 `language` prop；移除回合数显示；按钮文字三态（Loading... / ✓ Stage Complete / Submit）
- [x] **BottomBar 下一关按钮**：Stage 完成后显示绿色"→ Next Stage"按钮（`onNextStage` / `nextStageLabel` props）；最后一关完成后按钮改为"→ Back to Chapter"
- [x] **Tutorial 全屏独立弹窗**：Tutorial 重构为独立全屏 early return，不再借用真实 Stage 视图；内嵌可交互虚拟 Stage 预览（mock 控制可点击部署、威胁缓解状态实时联动）；mock 数据（`TUTORIAL_MOCK_CONTROLS` / `TUTORIAL_MOCK_THREATS`）定义于 `narrative.ts`；`openTutorial` 简化为仅设置 state，不再初始化游戏状态

### ❌ 未实现（待完成）

- [ ] **用户测试**：尚未进行正式用户测试

### ⚠️ 已知限制（设计决策）

- `Layout.tsx`、`TopBar.tsx`、`SidebarControls.tsx`、`CommandCenter.tsx`、`StatusPanel.tsx` 为早期原型遗留文件，未被 `main.tsx` 引用，保留作开发历史参考

---

## 10. 架构决策与注意事项

1. **单一主文件**：`App.tsx` 包含所有导航逻辑、游戏状态管理、GlossaryPanel 组件、Tutorial 全屏弹窗，约 1800 行。如需拆分，可将 GlossaryPanel、Tutorial、Stage 视图、Chapter 视图各自提取为独立组件。

2. **遗留文件**：`Layout.tsx` 等 5 个早期原型组件仍在 `src/components/`，但 `main.tsx` 只渲染 `App`，这些文件不影响运行。清理时可安全删除。

3. **样式统一**：主要样式在 `App.css`（深色主题），`index.css` 有少量补充。两文件均被 `main.tsx` 导入。

4. **预算单位**：Stage 预算用 `£200,000–£300,000`，控制成本 `control.cost * 10_000`（即 CSV 中的 cost 单位为万英镑）。

5. **L4 Scenario 映射**：
   - L4-1 → `L4-B2-SCENARIO-01`（IAM）
   - L4-2 → `L4-B3-SCENARIO-01`（Data）
   - L4-3 → `L4-B4-SCENARIO-01`（Network）

6. **dataLoading 键格式**：`${stageId}:${language}`，确保语言切换后强制重新加载。

---

## 11. 建议下一步方向

### 阶段 A：用户测试（最紧急）

1. 进行正式用户测试，收集反馈
2. 验证全通关流程：intro → L2 → 升职弹窗 → L3 → 升职弹窗 → L4 → ending 动画，无卡死
3. 验证扣分力度：L2 最坏情况（Medium×2 + Low×2 未缓解）= −40 分，章节分 60，仍可通过；L3（Medium×4）= −60 分，较紧张

### 阶段 B：体验完善（低优先级）

4. **L2/L3 stage-main-board 可视化升级**：当前为 Threat Status 列表，可升级为资产-威胁矩阵或简易网络拓扑图
5. 清理遗留原型文件（`Layout.tsx` 等）
6. 拆分 `App.tsx`：将 GlossaryPanel、各视图组件提取为独立文件

---

## 12. 文件快速参考

| 想修改什么 | 看哪个文件 |
|-----------|-----------|
| 关卡/阶段定义、导航逻辑 | `src/App.tsx` |
| Stage 威胁/控制/通关配置 | `src/data/stageData.ts` |
| 叙事数据（组织、晋升、职称、intro/ending 文本） | `src/data/narrative.ts` |
| TypeScript 数据类型 | `src/types.ts` |
| CSV/JSON 数据加载器 | `src/utils/dataLoader.ts` |
| 样式（深色主题） | `src/App.css` |
| 底部回合栏 | `src/components/BottomBar.tsx` |
| 威胁/控制原始数据 | `public/data/*.csv / *.json` |
