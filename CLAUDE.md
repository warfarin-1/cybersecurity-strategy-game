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
| 开发阶段 | **原型阶段** — UI 框架完成，游戏逻辑尚未实现 |

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
│   ├── App.tsx                  ← 导航层（关卡/阶段选择）
│   ├── App.css                  ← 导航层样式（深色主题）
│   ├── main.tsx                 ← React 入口
│   ├── index.css                ← 全局/游戏布局样式（浅色主题）
│   ├── types.ts                 ← 全局 TypeScript 类型定义
│   └── components/
│       ├── Layout.tsx           ← 游戏主布局 + 顶层状态管理
│       ├── TopBar.tsx           ← 顶部标题栏
│       ├── SidebarControls.tsx  ← 左侧控制面板
│       ├── CommandCenter.tsx    ← 中央指挥区（扇区管理）
│       ├── StatusPanel.tsx      ← 右侧状态面板（风险/日志）
│       └── BottomBar.tsx        ← 底部回合控制栏
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── eslint.config.js
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
  L4-1: High-Risk Identity Chain — 组合 IAM 弱点
  L4-2: Large Data Exposure      — 威胁树式数据泄露
  L4-3: Critical Service Compromise — 基础设施级事件
```

### 4.3 Chapter 视图（关卡选择页）

该视图包含：
- `Control Room`（控制室）：4 个占位框，未来显示：
  - Known Security Measures（已知安全措施）
  - Known Threat Types（已知威胁类型）
  - Budget Overview（预算概览）
  - Score Deductions（得分扣减）
- `Stage Grid`（阶段卡片网格）：每张卡片显示 `Risk Type: TBD` 和 `Status: Not started`（均为占位符）

顶部 TopBar 显示（硬编码占位符）：
- Budget Left: £1,000,000
- Score: 100/100

### 4.4 Stage 视图（阶段游戏页）

三列布局：
- **左侧**：Security Measures（安全措施列表，按钮形式）
- **中央**：`stage-main-board`（主可视化区域，当前为空占位）
- **右侧**：Security Requirements + Threats（安全要求与威胁列表）

顶部 TopBar 显示（硬编码占位符）：
- Budget Left: £200,000
- Score: 80/100

---

## 5. 游戏逻辑层（Layout.tsx + 子组件）

> **注意**：这是当前实现的原型游戏逻辑，与 App.tsx 导航系统目前是**独立的两套界面**，尚未整合。

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
```

### 5.2 初始扇区（4个）

| id | 名称 | 初始风险 |
|----|------|---------|
| physical | Physical Environment | High |
| boundary | Perimeter / Boundary | High |
| network | Network | High |
| computing | Computing Environment | High |

初始预算：100（单位未定）

### 5.3 风险计算逻辑

```typescript
// 控制数量 → 风险等级
function calculateRiskLevel(controlsApplied: number): RiskLevel {
    if (controlsApplied >= 3) return "Low";
    if (controlsApplied >= 1) return "Medium";
    return "High";
}

// 风险等级 → 数值分（用于 StatusPanel 显示）
function riskLevelToScore(level: RiskLevel): number {
    if (level === "Low")    return 30;
    if (level === "Medium") return 60;
    return 90; // High
}
```

`averageRiskScore` = 所有扇区 riskScore 的平均值（显示在 StatusPanel）

### 5.4 核心事件处理器

| 函数 | 位置 | 功能 | 当前状态 |
|------|------|------|---------|
| `handleDeployControl(sectorId)` | Layout.tsx:64 | 向扇区部署控制，消耗预算 10 | ✅ 基本可用 |
| `handleNextTurn()` | Layout.tsx:107 | 回合 +1，写日志 | ✅ 基本可用 |
| `handleRunAttackSimulation()` | Layout.tsx:116 | 攻击模拟 | ❌ 仅写日志，无实际逻辑 |

### 5.5 子组件接口

**CommandCenter**
```typescript
interface CommandCenterProps {
    sectors: Sector[];
    onDeployControl: (sectorId: string) => void;
}
```

**StatusPanel**
```typescript
interface StatusPanelProps {
    totalRiskScore: number;
    criticalIncidents: number;    // 当前硬编码为 0
    minorIncidents: number;       // 当前硬编码为 0
    logs: string[];
}
```

**BottomBar**
```typescript
interface BottomBarProps {
    turn: number;
    budget: number;
    onNextTurn: () => void;
    onRunAttackSimulation: () => void;
}
```

---

## 6. 样式系统

### 两套独立 CSS 主题

| 文件 | 用途 | 背景色 | 强调色 |
|------|------|--------|--------|
| `App.css` | 导航层（App.tsx） | `#05070d` 深黑 | `#7dd3fc` 蓝 / `#ffb84d` 橙 |
| `index.css` | 游戏布局层（Layout.tsx） | `#f0f2f5` 浅灰 | 白色卡片 |

> **注意**：两套主题目前并存，后续整合时需统一为深色主题（App.css 风格）。

### 关键 CSS 类（App.css）

| 类名 | 用途 |
|------|------|
| `.app-root` | 全页面容器，深黑背景 |
| `.top-bar` | 顶部导航栏（64px 高） |
| `.map-container` | Level 选择地图（flex，居中） |
| `.chapter-card` | 关卡选择卡片（260×220px，圆角，悬停动画） |
| `.chapter-layout` | 章节视图（grid，两行） |
| `.control-center` | 控制室面板 |
| `.stage-grid` | 阶段卡片网格（auto-fit） |
| `.stage-layout` | 阶段视图（三列 grid：220px / 1fr / 220px） |
| `.sidebar-pill` | 侧边栏圆角按钮 |
| `.sidebar-pill-danger` | 危险威胁按钮（红色边框） |
| `.stage-main-board` | 主可视化区域（虚线边框，待填充） |

---

## 7. 当前开发状态

### ✅ 已完成

- [x] React 19 + TypeScript + Vite 项目骨架
- [x] 三层导航系统（地图 → 章节 → 阶段）
- [x] 全部 11 个关卡/阶段的 metadata 定义
- [x] 阶段游戏界面三列布局
- [x] 基础 GameState 类型系统
- [x] 原型游戏逻辑（部署控制、回合推进、风险计算）
- [x] 深色主题 UI 框架（App.css，343 行）
- [x] 事件日志系统（StatusPanel）

### ❌ 未实现（核心功能缺失）

- [ ] **Stage 视图与 App 导航整合**：Layout.tsx 原型与 App.tsx 导航未连接
- [ ] **每个阶段的具体游戏内容**：控制列表、威胁列表均为硬编码占位符
- [ ] **攻击模拟引擎**：`handleRunAttackSimulation` 无实际逻辑
- [ ] **威胁数据库**：无任何威胁类型、攻击路径数据
- [ ] **控制数据库**：控制类型、成本、适用范围均未定义
- [ ] **风险计算引擎**：当前仅基于"控制数量"，无真实威胁建模
- [ ] **Chapter 视图数据填充**：Control Room 4 个面板均为占位符
- [ ] **阶段状态追踪**：每个阶段的 "Status"（未开始/进行中/完成）未实现
- [ ] **得分系统**：Score 当前为硬编码 100/80
- [ ] **预算系统**：Chapter 级别预算（£1,000,000）未与 Stage 级别关联
- [ ] **主可视化区域**：`stage-main-board` 中的威胁/控制可视化未实现
- [ ] **数据持久化**：无保存/加载机制

---

## 8. 架构决策与注意事项

1. **两套界面并存**：`App.tsx`（新导航）和 `Layout.tsx`（原型游戏）是独立的，`main.tsx` 当前渲染哪个需确认。整合时，Stage 视图应替换为基于 `gameState` 的动态内容。

2. **每个 Stage 应有独立数据**：不同关卡的控制选项、威胁类型、扇区组合应各不相同，需要建立 `stageData` 配置系统（可放在 `src/data/` 目录）。

3. **样式统一**：最终应使用 App.css 的深色主题，index.css 中的游戏布局样式需迁移或重写。

4. **`SidebarControls.tsx` 的 "CAF Focus" / "Deng Bao Focus"**：这两个场景按钮暗示游戏支持不同安全框架视角，是一个待实现的重要功能。

5. **预算单位问题**：导航层用 `£1,000,000`（英镑），原型层用数字 `100`，需统一。

---

## 9. 建议下一步方向

> 按优先级排序：

### 阶段 A：整合与连通（最紧急）
1. 确认 `main.tsx` 渲染入口，确保 App.tsx 为主入口
2. 将 Layout.tsx 的游戏逻辑整合进 App.tsx 的 Stage 视图
3. 将 GameState 升级为支持每个 Stage 独立实例

### 阶段 B：数据层建设
4. 创建 `src/data/stageData.ts`，为每个 Stage 定义：
   - 可用控制列表（名称、成本、效果、适用扇区）
   - 威胁列表（类型、风险等级、攻击路径）
   - 初始扇区配置
5. 将 Chapter 视图的 Control Room 面板与真实数据连接

### 阶段 C：游戏机制实现
6. 实现真实攻击模拟逻辑（基于威胁树或概率模型）
7. 实现得分系统（基于剩余风险 + 预算使用效率）
8. 实现阶段完成状态追踪

### 阶段 D：体验完善
9. 主可视化区域（stage-main-board）：网络拓扑图或资产-威胁矩阵
10. 教程/词汇表功能（SidebarControls 中已有入口）
11. 样式统一（迁移至深色主题）

---

## 10. 文件快速参考

| 想修改什么 | 看哪个文件 |
|-----------|-----------|
| 关卡/阶段定义 | `src/App.tsx` (STAGES_BY_CHAPTER) |
| 游戏核心状态逻辑 | `src/components/Layout.tsx` |
| TypeScript 数据类型 | `src/types.ts` |
| 控制/威胁列表（占位） | `src/components/SidebarControls.tsx` |
| 扇区卡片 UI | `src/components/CommandCenter.tsx` |
| 风险评分显示 / 日志 | `src/components/StatusPanel.tsx` |
| 回合 / 预算 / 攻击按钮 | `src/components/BottomBar.tsx` |
| 导航层样式 | `src/App.css` |
| 游戏布局样式 | `src/index.css` |
