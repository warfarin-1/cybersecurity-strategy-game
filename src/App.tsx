// src/App.tsx
import React, { useState, useEffect } from "react";
import "./App.css";
import type { ChapterState, StageGameState, Sector, RiskLevel } from "./types";
import type { Control, Threat, Level4Scenario } from "./utils/dataLoader";
import { loadControls, loadThreats, loadLevel4Tree } from "./utils/dataLoader";
import { getStageConfig } from "./data/stageData";
import { BottomBar } from "./components/BottomBar";

// --- Helpers (mirrored from Layout.tsx) ---

function calculateRiskLevel(controlsApplied: number): RiskLevel {
    if (controlsApplied >= 3) return "Low";
    if (controlsApplied >= 1) return "Medium";
    return "High";
}

const BASE_SECTORS: Sector[] = [
    { id: "physical",  name: "Physical Environment",  controlsApplied: 0, riskLevel: "High" },
    { id: "boundary",  name: "Perimeter / Boundary",  controlsApplied: 0, riskLevel: "High" },
    { id: "network",   name: "Network",                controlsApplied: 0, riskLevel: "High" },
    { id: "computing", name: "Computing Environment",  controlsApplied: 0, riskLevel: "High" },
];

/** Map a control's category to the sector it logically protects. */
function controlToSector(control: Control): string {
    switch (control.category) {
        case "Network":  return "boundary";
        case "Identity": return "computing";
        case "Data":     return "physical";
        default:         return "computing"; // Awareness, Governance, System, Monitoring, etc.
    }
}

function makeStageGameState(stageId: string): StageGameState {
    return {
        stageId,
        status: "in_progress",
        turn: 1,
        budget: 200_000,
        sectors: BASE_SECTORS.map((s) => ({ ...s })),
        logs: [],
        isCompleted: false,
        deployedControlIds: [],
    };
}

function makeChapterState(chapterId: number): ChapterState {
    return {
        chapterId,
        totalBudget: 1_000_000,
        remainingBudget: 1_000_000,
        score: 100,
        stageStates: {},
    };
}

function getRiskTypeLabel(stageId: string): string {
    const config = getStageConfig(stageId);
    const firstThreatId = config?.threatIds[0] ?? "";
    if (firstThreatId.includes("-PH"))   return "Phishing";
    if (firstThreatId.includes("-IAM"))  return "Identity & Access";
    if (firstThreatId.includes("-DATA")) return "Data Handling";
    if (firstThreatId.includes("-NET"))  return "Network";
    if (firstThreatId.includes("-END"))  return "Endpoint";
    return "Mixed";
}

type ChapterLevel = 2 | 3 | 4;

interface ChapterMeta {
    id: ChapterLevel;
    title: string;
    subtitle: string;
}

interface StageMeta {
    id: string;
    name: string;
    description: string;
}

const CHAPTERS: ChapterMeta[] = [
    { id: 2, title: "Level 2 – Basic Protection", subtitle: "Essential cyber hygiene" },
    { id: 3, title: "Level 3 – Critical Business", subtitle: "Stronger security posture" },
    { id: 4, title: "Level 4 – Key Infrastructure", subtitle: "High assurance environment" },
];

const STAGES_BY_CHAPTER: Record<ChapterLevel, StageMeta[]> = {
    2: [
        { id: "L2-1", name: "L2-1 Phishing Basics", description: "Introductory social engineering risks" },
        { id: "L2-2", name: "L2-2 Identity & Access", description: "Passwords and basic account controls" },
        { id: "L2-3", name: "L2-3 Data Handling", description: "Storing and sharing simple datasets" },
        { id: "L2-4", name: "L2-4 Network Hygiene", description: "Basic network and device security" },
    ],
    3: [
        { id: "L3-1", name: "L3-1 Targeted Phishing", description: "More realistic spear phishing" },
        { id: "L3-2", name: "L3-2 Cloud Identity", description: "Accounts across SaaS services" },
        { id: "L3-3", name: "L3-3 Data at Scale", description: "Larger datasets and access control" },
        { id: "L3-4", name: "L3-4 Network Exposure", description: "Internet-facing systems and logging" },
    ],
    4: [
        { id: "L4-1", name: "L4-1 High-Risk Identity Chain", description: "Combined IAM weaknesses" },
        { id: "L4-2", name: "L4-2 Large Data Exposure", description: "Threat-tree style data leak" },
        { id: "L4-3", name: "L4-3 Critical Service Compromise", description: "Infrastructure-level incidents" },
    ],
};

type View =
    | { type: "map" }
    | { type: "chapter"; chapter: ChapterLevel }
    | { type: "stage"; chapter: ChapterLevel; stageId: string };

const App: React.FC = () => {
    const [view, setView] = useState<View>({ type: "map" });
    const [chapterState, setChapterState] = useState<ChapterState | null>(null);
    const [completedChapters, setCompletedChapters] = useState<Set<number>>(() => {
        try {
            const saved = localStorage.getItem("completedChapters");
            return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
        } catch {
            return new Set<number>();
        }
    });
    const [activeStageState, setActiveStageState] = useState<StageGameState | null>(null);
    const [stageThreats, setStageThreats] = useState<Threat[]>([]);
    const [stageControls, setStageControls] = useState<Control[]>([]);
    const [deployedControlIds, setDeployedControlIds] = useState<string[]>([]);
    // Tracks which stageId has finished loading — derived dataLoading avoids sync setState in effect
    const [loadedForStageId, setLoadedForStageId] = useState<string | null>(null);
    const [level4Scenario, setLevel4Scenario] = useState<Level4Scenario | null>(null);
    const dataLoading = view.type === "stage" && loadedForStageId !== view.stageId;

    // Load threats and controls whenever the active stage changes
    useEffect(() => {
        if (view.type !== "stage") {
            setLevel4Scenario(null);
            return;
        }
        const config = getStageConfig(view.stageId);
        if (!config) return;

        const stageId = view.stageId;
        const chapter = view.chapter;

        if (chapter === 4) {
            const SCENARIO_MAP: Record<string, string> = {
                "L4-1": "L4-B2-SCENARIO-01",
                "L4-2": "L4-B3-SCENARIO-01",
                "L4-3": "L4-B4-SCENARIO-01",
            };
            Promise.all([loadThreats(4), loadControls(), loadLevel4Tree()]).then(
                ([allThreats, allControls, scenarios]) => {
                    setStageThreats(allThreats.filter((t) => config.threatIds.includes(t.threatId)));
                    setStageControls(allControls.filter((c) => config.availableControlIds.includes(c.controlId)));
                    const scenarioId = SCENARIO_MAP[stageId];
                    setLevel4Scenario(scenarios.find((s) => s.scenarioId === scenarioId) ?? null);
                    setLoadedForStageId(stageId);
                }
            );
        } else {
            setLevel4Scenario(null);
            Promise.all([loadThreats(chapter), loadControls()]).then(
                ([allThreats, allControls]) => {
                    setStageThreats(allThreats.filter((t) => config.threatIds.includes(t.threatId)));
                    setStageControls(allControls.filter((c) => config.availableControlIds.includes(c.controlId)));
                    setLoadedForStageId(stageId);
                }
            );
        }
    }, [view]);

    const isChapterUnlocked = (chapter: ChapterLevel): boolean => {
        if (chapter === 2) return true;
        if (chapter === 3) return completedChapters.has(2);
        if (chapter === 4) return completedChapters.has(3);
        return true;
    };

    const handleChapterClick = (chapterId: ChapterLevel) => {
        if (!isChapterUnlocked(chapterId)) return;
        setChapterState((prev) =>
            prev?.chapterId === chapterId ? prev : makeChapterState(chapterId)
        );
        setView({ type: "chapter", chapter: chapterId });
    };

    const isStageUnlocked = (stageId: string): boolean => {
        // Find which chapter this stage belongs to
        for (const [, stages] of Object.entries(STAGES_BY_CHAPTER) as [string, StageMeta[]][]) {
            const index = stages.findIndex((s) => s.id === stageId);
            if (index === -1) continue;
            if (index === 0) return true;
            const prevStageId = stages[index - 1].id;
            return chapterState?.stageStates[prevStageId]?.status === "completed";
        }
        return true; // unknown stage — don't block
    };

    const handleStageClick = (chapter: ChapterLevel, stageId: string) => {
        if (!isStageUnlocked(stageId)) return;

        // Initialise (or reuse) chapter state
        let current = chapterState;
        if (!current || current.chapterId !== chapter) {
            current = makeChapterState(chapter);
            setChapterState(current);
        }

        // Reuse existing stage state or create a fresh one
        const stageState = current.stageStates[stageId] ?? makeStageGameState(stageId);
        setActiveStageState(stageState);

        if (!current.stageStates[stageId]) {
            setChapterState((prev) =>
                prev ? { ...prev, stageStates: { ...prev.stageStates, [stageId]: stageState } } : prev
            );
        }

        setDeployedControlIds(stageState.deployedControlIds);
        setView({ type: "stage", chapter, stageId });
    };

    const handleDeployControl = (controlId: string) => {
        if (!activeStageState) return;

        const control = stageControls.find((c) => c.controlId === controlId);
        if (!control) return;

        if (deployedControlIds.includes(controlId)) {
            const newStageState: StageGameState = {
                ...activeStageState,
                logs: [...activeStageState.logs, `[T${activeStageState.turn}] Already deployed: ${control.name}.`],
            };
            setActiveStageState(newStageState);
            setChapterState((prev) =>
                prev ? { ...prev, stageStates: { ...prev.stageStates, [newStageState.stageId]: newStageState } } : prev
            );
            return;
        }

        const cost = control.cost * 10_000;

        if (activeStageState.budget < cost) {
            const newStageState: StageGameState = {
                ...activeStageState,
                logs: [...activeStageState.logs, `[T${activeStageState.turn}] Deployment skipped: insufficient budget.`],
            };
            setActiveStageState(newStageState);
            setChapterState((prev) =>
                prev ? { ...prev, stageStates: { ...prev.stageStates, [newStageState.stageId]: newStageState } } : prev
            );
            return;
        }

        const sectorId = controlToSector(control);
        const updatedSectors = activeStageState.sectors.map((sector) => {
            if (sector.id !== sectorId) return sector;
            const newControls = sector.controlsApplied + 1;
            return { ...sector, controlsApplied: newControls, riskLevel: calculateRiskLevel(newControls) };
        });
        const newBudget = activeStageState.budget - cost;

        // Completion check — compute new deployed set synchronously
        const newDeployedIds = [...deployedControlIds, controlId];
        const stageConfig = getStageConfig(activeStageState.stageId);
        const allRequiredDeployed =
            stageConfig != null &&
            stageConfig.requiredControlIds.length > 0 &&
            stageConfig.requiredControlIds.every((id) => newDeployedIds.includes(id));

        const deployLog = `[T${activeStageState.turn}] Deployed "${control.name}". Budget: £${newBudget.toLocaleString()}.`;
        const newStageState: StageGameState = {
            ...activeStageState,
            budget: newBudget,
            sectors: updatedSectors,
            deployedControlIds: newDeployedIds,
            isCompleted: allRequiredDeployed ? true : activeStageState.isCompleted,
            status: allRequiredDeployed ? "completed" : activeStageState.status,
            logs: [
                ...activeStageState.logs,
                deployLog,
                ...(allRequiredDeployed
                    ? ["✓ Stage complete! All required controls deployed."]
                    : []),
            ],
        };

        setActiveStageState(newStageState);
        setDeployedControlIds(newDeployedIds);
        setChapterState((prev) =>
            prev
                ? {
                      ...prev,
                      remainingBudget: prev.remainingBudget - cost,
                      stageStates: { ...prev.stageStates, [newStageState.stageId]: newStageState },
                  }
                : prev
        );

        // If this deploy completed the stage, check if all chapter stages are now done
        if (allRequiredDeployed && view.type === "stage") {
            const chapterStages = STAGES_BY_CHAPTER[view.chapter];
            const allChapterDone = chapterStages.every(
                (s) =>
                    s.id === activeStageState.stageId ||
                    chapterState?.stageStates[s.id]?.status === "completed"
            );
            if (allChapterDone) {
                setCompletedChapters((prev) => {
                    const next = new Set([...prev, view.chapter]);
                    localStorage.setItem("completedChapters", JSON.stringify([...next]));
                    return next;
                });
            }
        }
    };

    const handleNextTurn = () => {
        if (!activeStageState) return;

        const config = getStageConfig(activeStageState.stageId);

        let totalDeduction = 0;
        let h = 0, m = 0, l = 0;

        if (config) {
            for (const threat of stageThreats) {
                const mitigated = threat.recommendedControlIds.some((id) =>
                    deployedControlIds.includes(id)
                );
                if (!mitigated) {
                    if (threat.severity === "High")        { h++; totalDeduction += 10; }
                    else if (threat.severity === "Medium") { m++; totalDeduction += 3; }
                    else                                   { l++; totalDeduction += 1; }
                }
            }
        }

        const turnLog = config
            ? `[T${activeStageState.turn + 1}] New turn. -${totalDeduction} pts (High: ${h}×10, Medium: ${m}×3, Low: ${l}×1)`
            : `[T${activeStageState.turn + 1}] New turn started.`;

        const newStageState: StageGameState = {
            ...activeStageState,
            turn: activeStageState.turn + 1,
            logs: [...activeStageState.logs, turnLog],
        };

        setActiveStageState(newStageState);
        setChapterState((prev) => {
            if (!prev) return prev;
            const newScore = Math.max(0, prev.score - totalDeduction);
            return {
                ...prev,
                score: newScore,
                stageStates: { ...prev.stageStates, [newStageState.stageId]: newStageState },
            };
        });
    };

    const goBackToMap = () => setView({ type: "map" });
    const goBackToChapter = (chapter: ChapterLevel) => setView({ type: "chapter", chapter });

    if (view.type === "map") {
        return (
            <div className="app-root">
                <header className="top-bar">
                    <div className="top-bar-title">Cybersecurity Command Center</div>
                    <div className="top-bar-subtitle">Select a Level to Begin</div>
                </header>
                <main className="map-container">
                    {CHAPTERS.map((chapter) => {
                        const unlocked = isChapterUnlocked(chapter.id);
                        const completed = completedChapters.has(chapter.id);
                        const cardClass = [
                            "chapter-card",
                            !unlocked ? "chapter-card-locked" : "",
                        ].filter(Boolean).join(" ");
                        return (
                            <button
                                key={chapter.id}
                                className={cardClass}
                                onClick={() => handleChapterClick(chapter.id)}
                            >
                                <div className="chapter-icon">Lv.{chapter.id}</div>
                                <div className="chapter-text-main">{chapter.title}</div>
                                <div className="chapter-text-sub">{chapter.subtitle}</div>
                                {!unlocked && (
                                    <div className="chapter-lock-label">
                                        🔒 Complete Level {chapter.id - 1} to unlock
                                    </div>
                                )}
                                {unlocked && completed && (
                                    <div className="chapter-complete-label">✓ Completed</div>
                                )}
                            </button>
                        );
                    })}
                </main>
            </div>
        );
    }

    if (view.type === "chapter") {
        const meta = CHAPTERS.find((c) => c.id === view.chapter)!;
        const stages = STAGES_BY_CHAPTER[view.chapter];

        // Panel 1: control IDs from all completed stages (deduplicated)
        const knownControlIds: string[] = [];
        for (const stage of stages) {
            if (chapterState?.stageStates[stage.id]?.status === "completed") {
                const cfg = getStageConfig(stage.id);
                if (cfg) {
                    for (const id of cfg.requiredControlIds) {
                        if (!knownControlIds.includes(id)) knownControlIds.push(id);
                    }
                }
            }
        }

        // Panel 2: unique risk type labels across all stages in this chapter
        const knownThreatTypes = [
            ...new Set(
                stages.map((s) => getRiskTypeLabel(s.id)).filter((t) => t !== "TBD")
            ),
        ];

        // Panel 3: budget figures
        const totalBudget      = chapterState?.totalBudget      ?? 1_000_000;
        const remainingBudget  = chapterState?.remainingBudget  ?? 1_000_000;
        const spentBudget      = totalBudget - remainingBudget;

        // Panel 4: score figures
        const currentScore       = chapterState?.score ?? 100;
        const chapterPassingScore = Math.max(
            ...stages.map((s) => getStageConfig(s.id)?.passingScore ?? 60)
        );

        return (
            <div className="app-root">
                <header className="top-bar">
                    <button className="back-button" onClick={goBackToMap}>
                        ← Back
                    </button>
                    <div className="top-bar-title">{meta.title}</div>
                    <div className="top-bar-right">
                        <div className="top-bar-stat">
                            <span className="stat-label">Budget Left</span>
                            <span className="stat-value">
                                £ {(chapterState?.remainingBudget ?? 1_000_000).toLocaleString()}
                            </span>
                        </div>
                        <div className="top-bar-stat">
                            <span className="stat-label">Score</span>
                            <span className="stat-value">{chapterState?.score ?? 100} / 100</span>
                        </div>
                    </div>
                </header>

                <main className="chapter-layout">
                    <section className="control-center">
                        <div className="control-center-header">Control Room</div>
                        <div className="control-center-body">
                            <div className="control-room-column">
                                <div className="control-room-box">
                                    <div className="box-title">Known Security Measures</div>
                                    <div className="box-text">
                                        {knownControlIds.length === 0 ? (
                                            <span>No controls deployed yet</span>
                                        ) : (
                                            knownControlIds.map((id) => (
                                                <div key={id}>✓ {id}</div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="control-room-box">
                                    <div className="box-title">Known Threat Types</div>
                                    <div className="box-text">
                                        {knownThreatTypes.length === 0 ? (
                                            <span>No threats encountered yet</span>
                                        ) : (
                                            knownThreatTypes.map((t) => (
                                                <div key={t}>⚠ {t}</div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="control-room-column">
                                <div className="control-room-box">
                                    <div className="box-title">Budget Overview</div>
                                    <div className="box-text">
                                        <div>Total:     £{totalBudget.toLocaleString()}</div>
                                        <div>Remaining: £{remainingBudget.toLocaleString()}</div>
                                        <div>Spent:     £{spentBudget.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="control-room-box">
                                    <div className="box-title">Score &amp; Deductions</div>
                                    <div className="box-text">
                                        <div>Current Score: {currentScore}/100</div>
                                        <div>Passing Score: {chapterPassingScore}</div>
                                        <div>
                                            Status:{" "}
                                            {currentScore >= chapterPassingScore
                                                ? "✓ On track"
                                                : "⚠ At risk"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="stage-grid">
                        {stages.map((stage) => {
                            const stageState = chapterState?.stageStates[stage.id];
                            const status = stageState?.status ?? "not_started";
                            const unlocked = isStageUnlocked(stage.id);
                            const statusLabel =
                                !unlocked                ? "🔒 Locked"    :
                                status === "completed"   ? "✓ Completed"  :
                                status === "in_progress" ? "In progress"  :
                                                           "Not started";
                            const statusColor =
                                !unlocked                ? "#6b7280"  :
                                status === "completed"   ? "#4ade80"  :
                                status === "in_progress" ? "#ffb84d"  :
                                                           undefined;
                            const cardClass = [
                                "stage-card",
                                !unlocked              ? "stage-card-locked"    : "",
                                status === "completed" ? "stage-card-completed" : "",
                            ].filter(Boolean).join(" ");
                            return (
                                <button
                                    key={stage.id}
                                    className={cardClass}
                                    onClick={() => handleStageClick(view.chapter, stage.id)}
                                    style={!unlocked ? { cursor: "not-allowed" } : undefined}
                                >
                                    <div className="stage-title">{stage.name}</div>
                                    <div className="stage-desc">{stage.description}</div>
                                    <div className="stage-meta-row">
                                        <span className="stage-meta-tag">
                                            Risk Type: {getRiskTypeLabel(stage.id)}
                                        </span>
                                        <span className="stage-meta-tag" style={{ color: statusColor }}>
                                            Status: {statusLabel}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </section>
                </main>
            </div>
        );
    }

    // view.type === "stage"
    const chapterMeta = CHAPTERS.find((c) => c.id === view.chapter)!;
    const stageMeta = STAGES_BY_CHAPTER[view.chapter].find(
        (s) => s.id === view.stageId
    )!;
    const stageConfig = getStageConfig(view.stageId);

    return (
        <div className="app-root">
            <header className="top-bar">
                <button className="back-button" onClick={() => goBackToChapter(view.chapter)}>
                    ← Chapter
                </button>
                <div className="top-bar-title">{stageMeta.name}</div>
                <div className="top-bar-right">
                    <div className="top-bar-stat">
                        <span className="stat-label">Chapter</span>
                        <span className="stat-value">Lv.{chapterMeta.id}</span>
                    </div>
                    <div className="top-bar-stat">
                        <span className="stat-label">Budget Left</span>
                        <span className="stat-value">
                            £ {activeStageState ? activeStageState.budget.toLocaleString() : "200,000"}
                        </span>
                    </div>
                    <div className="top-bar-stat">
                        <span className="stat-label">Chapter Score</span>
                        <span className="stat-value">
                            {chapterState ? chapterState.score : 100} / 100
                        </span>
                    </div>
                </div>
            </header>

            <main className="stage-layout">
                <aside className="stage-sidebar-left">
                    <div className="sidebar-section">
                        <div className="sidebar-title">Security Measures</div>
                        {dataLoading ? (
                            <div className="sidebar-loading">Loading...</div>
                        ) : stageControls.length === 0 ? (
                            <div className="sidebar-loading">No controls available</div>
                        ) : (
                            stageControls.map((control) => {
                                const deployed = deployedControlIds.includes(control.controlId);
                                return (
                                    <button
                                        key={control.controlId}
                                        className="sidebar-pill"
                                        onClick={() => handleDeployControl(control.controlId)}
                                        disabled={deployed}
                                    >
                                        {deployed ? `${control.name} ✓` : control.name}
                                        <span>£{(control.cost * 10_000).toLocaleString()}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                <section className="stage-main-area">
                    <div className="stage-main-title">Secure Area Boundaries</div>
                    <div className="stage-main-board">
                        {view.chapter === 4 && level4Scenario !== null ? (
                            <div className="threat-tree-panel">
                                <div className="threat-scenario-header">
                                    <div className="threat-scenario-title">
                                        Scenario: {level4Scenario.scenarioName}
                                    </div>
                                    <div className="threat-scenario-desc">{level4Scenario.description}</div>
                                </div>
                                <div className="threat-chain-label">Attack Chain</div>
                                {level4Scenario.subThreatIds.map((subId) => {
                                    const threat = stageThreats.find((t) => t.threatId === subId);
                                    const mitigated = threat
                                        ? threat.recommendedControlIds.some((id) => deployedControlIds.includes(id))
                                        : false;
                                    return (
                                        <div
                                            key={subId}
                                            className={`threat-node ${mitigated ? "threat-node-mitigated" : "threat-node-unresolved"}`}
                                        >
                                            <div>
                                                <div className="threat-node-id">{subId}</div>
                                                <div className="threat-node-name">{threat?.scenarioName ?? subId}</div>
                                            </div>
                                            <div className={mitigated ? "threat-node-status-resolved" : "threat-node-status-unresolved"}>
                                                {mitigated ? "✓ Mitigated" : "⚠ Unresolved"}
                                            </div>
                                        </div>
                                    );
                                })}
                                {chapterState && stageConfig && chapterState.score < stageConfig.passingScore && (
                                    <div className="stage-status-warning">
                                        ⚠ Score below passing threshold ({stageConfig.passingScore}). Deploy more controls to recover score.
                                    </div>
                                )}
                                {activeStageState?.isCompleted && (
                                    <div className="stage-status-success">
                                        ✓ Stage Complete — All required controls deployed. Proceed to the next stage.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {activeStageState?.isCompleted && (
                                    <div className="stage-status-success">
                                        ✓ Stage Complete — All required controls deployed. Proceed to the next stage.
                                    </div>
                                )}
                                {chapterState && stageConfig && chapterState.score < stageConfig.passingScore && (
                                    <div className="stage-status-warning">
                                        ⚠ Score below passing threshold ({stageConfig.passingScore}). Deploy more controls to recover score.
                                    </div>
                                )}
                                <div className="stage-main-placeholder">
                                    Here we will visualise where controls are deployed and how threats are mitigated.
                                </div>
                            </>
                        )}
                    </div>
                </section>

                <aside className="stage-sidebar-right">
                    <div className="sidebar-section">
                        <div className="sidebar-title">Security Requirements</div>
                        {stageConfig ? (
                            stageConfig.requiredControlIds.map((reqId) => {
                                const deployed = deployedControlIds.includes(reqId);
                                const control = stageControls.find((c) => c.controlId === reqId);
                                return (
                                    <div
                                        key={reqId}
                                        className={`sidebar-pill ${deployed ? "sidebar-pill-success" : "sidebar-pill-danger"}`}
                                    >
                                        {deployed ? "✓" : "✗"} {control?.name ?? reqId}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="sidebar-loading">Loading...</div>
                        )}
                    </div>
                    <div className="sidebar-section">
                        <div className="sidebar-title">Threats</div>
                        {dataLoading ? (
                            <div className="sidebar-loading">Loading...</div>
                        ) : stageThreats.length === 0 ? (
                            <div className="sidebar-loading">No threats available</div>
                        ) : (
                            stageThreats.map((threat) => (
                                <div
                                    key={threat.threatId}
                                    className={`sidebar-pill ${threat.severity === "High" ? "sidebar-pill-danger" : ""}`}
                                >
                                    {threat.scenarioName}
                                    <span className="threat-severity">{threat.severity}</span>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </main>
            <BottomBar
                turn={activeStageState?.turn ?? 1}
                budget={activeStageState?.budget ?? 200_000}
                score={chapterState?.score}
                isCompleted={activeStageState?.isCompleted ?? false}
                isLoading={dataLoading}
                onNextTurn={handleNextTurn}
                onRunAttackSimulation={() => {}}
            />
        </div>
    );
};

export default App;
