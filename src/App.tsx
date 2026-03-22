// src/App.tsx
import React, { useState, useEffect } from "react";
import "./App.css";
import type { ChapterState, StageGameState, Sector, RiskLevel } from "./types";
import type { Control, Threat } from "./utils/dataLoader";
import { loadControls, loadThreats } from "./utils/dataLoader";
import { getStageConfig } from "./data/stageData";

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
    const [activeStageState, setActiveStageState] = useState<StageGameState | null>(null);
    const [stageThreats, setStageThreats] = useState<Threat[]>([]);
    const [stageControls, setStageControls] = useState<Control[]>([]);
    const [deployedControlIds, setDeployedControlIds] = useState<string[]>([]);

    // Load threats and controls whenever the active stage changes
    useEffect(() => {
        if (view.type !== "stage") {
            setStageThreats([]);
            setStageControls([]);
            return;
        }
        const config = getStageConfig(view.stageId);
        if (!config) return;

        Promise.all([loadThreats(view.chapter), loadControls()]).then(
            ([allThreats, allControls]) => {
                setStageThreats(allThreats.filter((t) => config.threatIds.includes(t.threatId)));
                setStageControls(allControls.filter((c) => config.availableControlIds.includes(c.controlId)));
            }
        );
    }, [view]);

    const handleChapterClick = (chapterId: ChapterLevel) => {
        setView({ type: "chapter", chapter: chapterId });
    };

    const handleStageClick = (chapter: ChapterLevel, stageId: string) => {
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

        setDeployedControlIds([]);
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
        const newStageState: StageGameState = {
            ...activeStageState,
            budget: newBudget,
            sectors: updatedSectors,
            logs: [
                ...activeStageState.logs,
                `[T${activeStageState.turn}] Deployed "${control.name}". Budget: £${newBudget.toLocaleString()}.`,
            ],
        };

        setActiveStageState(newStageState);
        setDeployedControlIds((prev) => [...prev, controlId]);
        setChapterState((prev) =>
            prev
                ? {
                      ...prev,
                      remainingBudget: prev.remainingBudget - cost,
                      stageStates: { ...prev.stageStates, [newStageState.stageId]: newStageState },
                  }
                : prev
        );
    };

    const handleNextTurn = () => {
        if (!activeStageState) return;

        const newStageState: StageGameState = {
            ...activeStageState,
            turn: activeStageState.turn + 1,
            logs: [...activeStageState.logs, `[T${activeStageState.turn + 1}] New turn started.`],
        };

        setActiveStageState(newStageState);
        setChapterState((prev) =>
            prev ? { ...prev, stageStates: { ...prev.stageStates, [newStageState.stageId]: newStageState } } : prev
        );
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
                    {CHAPTERS.map((chapter) => (
                        <button
                            key={chapter.id}
                            className="chapter-card"
                            onClick={() => handleChapterClick(chapter.id)}
                        >
                            <div className="chapter-icon">Lv.{chapter.id}</div>
                            <div className="chapter-text-main">{chapter.title}</div>
                            <div className="chapter-text-sub">{chapter.subtitle}</div>
                        </button>
                    ))}
                </main>
            </div>
        );
    }

    if (view.type === "chapter") {
        const meta = CHAPTERS.find((c) => c.id === view.chapter)!;
        const stages = STAGES_BY_CHAPTER[view.chapter];

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
                                        List of controls the player has already seen in this chapter.
                                    </div>
                                </div>
                                <div className="control-room-box">
                                    <div className="box-title">Known Threat Types</div>
                                    <div className="box-text">
                                        Summary of threat types encountered so far.
                                    </div>
                                </div>
                            </div>
                            <div className="control-room-column">
                                <div className="control-room-box">
                                    <div className="box-title">Budget Overview</div>
                                    <div className="box-text">
                                        Per-level spending and remaining funds for this chapter.
                                    </div>
                                </div>
                                <div className="control-room-box">
                                    <div className="box-title">Score Deductions</div>
                                    <div className="box-text">
                                        High/medium/low risk penalties for each completed level.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="stage-grid">
                        {stages.map((stage) => (
                            <button
                                key={stage.id}
                                className="stage-card"
                                onClick={() => handleStageClick(view.chapter, stage.id)}
                            >
                                <div className="stage-title">{stage.name}</div>
                                <div className="stage-desc">{stage.description}</div>
                                <div className="stage-meta-row">
                                    <span className="stage-meta-tag">Risk Type: TBD</span>
                                    <span className="stage-meta-tag">Status: Not started</span>
                                </div>
                            </button>
                        ))}
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
                        <span className="stat-label">Score</span>
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
                        {stageControls.length === 0 ? (
                            <div className="sidebar-loading">Loading...</div>
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
                        <div className="stage-main-placeholder">
                            Here we will visualise where controls are deployed and how threats are mitigated.
                        </div>
                    </div>
                    <button className="sidebar-pill" onClick={handleNextTurn}>
                        Next Turn (T{activeStageState ? activeStageState.turn : 1})
                    </button>
                </section>

                <aside className="stage-sidebar-right">
                    <div className="sidebar-section">
                        <div className="sidebar-title">Security Requirements</div>
                        <button className="sidebar-pill">Boundary Protection</button>
                        <button className="sidebar-pill">Access Control</button>
                        <button className="sidebar-pill">Logging / Monitoring</button>
                    </div>
                    <div className="sidebar-section">
                        <div className="sidebar-title">Threats</div>
                        {stageThreats.length === 0 ? (
                            <div className="sidebar-loading">Loading...</div>
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
        </div>
    );
};

export default App;
