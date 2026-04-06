// src/App.tsx
import React, { useState, useEffect } from "react";
import "./App.css";
import type { ChapterState, StageGameState, Sector, RiskLevel } from "./types";
import type { Control, Threat, Level4Scenario } from "./utils/dataLoader";
import { loadControls, loadThreats, loadLevel4Tree } from "./utils/dataLoader";
import { getStageConfig } from "./data/stageData";
import { ORG_PROFILES, PROMOTION_EVENTS, getPlayerTitle, INTRO_LINES, ENDING_LINES, TUTORIAL_CARDS, TUTORIAL_MOCK_CONTROLS, TUTORIAL_MOCK_THREATS } from "./data/narrative";
import { BottomBar } from "./components/BottomBar";

// Helper functions used across the game

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

/** Work out which sector a security control belongs to. */
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
        budget: 200000,
        sectors: BASE_SECTORS.map((s) => ({ ...s })),
        logs: [],
        isCompleted: false,
        deployedControlIds: [],
    };
}

function makeChapterState(chapterId: number): ChapterState {
    return {
        chapterId,
        totalBudget: 1000000,
        remainingBudget: 1000000,
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

// GlossaryPanel component

interface GlossaryPanelProps {
    language: "en" | "zh";
    onClose: () => void;
}

const GlossaryPanel: React.FC<GlossaryPanelProps> = ({ language, onClose }) => {
    const t = (en: string, zh: string) => language === "zh" ? zh : en;
    const [activeTab, setActiveTab] = useState<"controls" | "threats">("controls");
    const [searchQuery, setSearchQuery] = useState("");
    const [allControls, setAllControls] = useState<Control[]>([]);
    const [allThreats, setAllThreats] = useState<Threat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            loadControls(language),
            loadThreats(2, language),
            loadThreats(3, language),
            loadThreats(4, language),
        ]).then(([controls, t2, t3, t4]) => {
            setAllControls(controls);
            setAllThreats([...t2, ...t3, ...t4].sort((a, b) => a.level - b.level));
            setLoading(false);
        });
    }, [language]);

    const q = searchQuery.toLowerCase();
    const filteredControls = q
        ? allControls.filter((c) =>
            c.controlId.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.nameZh.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
          )
        : allControls;
    const filteredThreats = q
        ? allThreats.filter((th) =>
            th.threatId.toLowerCase().includes(q) ||
            th.scenarioName.toLowerCase().includes(q) ||
            th.scenarioNameZh.toLowerCase().includes(q) ||
            th.riskType.toLowerCase().includes(q)
          )
        : allThreats;

    return (
        <div className="glossary-overlay" onClick={onClose}>
            <div className="glossary-panel" onClick={(e) => e.stopPropagation()}>
                <div className="glossary-header">
                    <h2>{t("Cybersecurity Glossary", "网络安全图鉴")}</h2>
                    <button className="glossary-close" onClick={onClose}>✕</button>
                </div>
                <input
                    className="glossary-search"
                    placeholder={t("Search controls or threats...", "搜索安全措施或威胁...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="glossary-tabs">
                    <button
                        className={`glossary-tab ${activeTab === "controls" ? "active" : ""}`}
                        onClick={() => setActiveTab("controls")}
                    >
                        {t("Security Controls", "安全措施")} ({filteredControls.length})
                    </button>
                    <button
                        className={`glossary-tab ${activeTab === "threats" ? "active" : ""}`}
                        onClick={() => setActiveTab("threats")}
                    >
                        {t("Threats", "威胁图鉴")} ({filteredThreats.length})
                    </button>
                </div>
                <div className="glossary-content">
                    {loading ? (
                        <div className="sidebar-loading">{t("Loading...", "加载中...")}</div>
                    ) : activeTab === "controls" ? (
                        filteredControls.length === 0 ? (
                            <div className="sidebar-loading">{t("No results found.", "未找到相关结果。")}</div>
                        ) : filteredControls.map((control) => (
                            <div key={control.controlId} className="glossary-item">
                                <div className="glossary-item-header">
                                    <span className="glossary-item-id">{control.controlId}</span>
                                    <span className="glossary-item-category">{control.category}</span>
                                    <span className="glossary-item-cost">
                                        £{(control.cost * 10000).toLocaleString()}
                                    </span>
                                </div>
                                <div className="glossary-item-name">
                                    {language === "zh" && control.nameZh ? control.nameZh : control.name}
                                </div>
                                <div className="glossary-item-desc">
                                    {language === "zh" && control.descriptionZh ? control.descriptionZh : control.description}
                                </div>
                                <div className="glossary-item-caf">CAF: {control.cafPrinciple}</div>
                            </div>
                        ))
                    ) : (
                        filteredThreats.length === 0 ? (
                            <div className="sidebar-loading">{t("No results found.", "未找到相关结果。")}</div>
                        ) : filteredThreats.map((threat) => (
                            <div key={threat.threatId} className="glossary-item">
                                <div className="glossary-item-header">
                                    <span className="glossary-item-id">{threat.threatId}</span>
                                    <span className={`glossary-item-severity severity-${threat.severity.toLowerCase()}`}>
                                        {threat.severity}
                                    </span>
                                    <span className="glossary-item-category">{threat.riskType}</span>
                                </div>
                                <div className="glossary-item-name">
                                    {language === "zh" && threat.scenarioNameZh ? threat.scenarioNameZh : threat.scenarioName}
                                </div>
                                <div className="glossary-item-desc">
                                    {language === "zh" && threat.descriptionZh ? threat.descriptionZh : threat.description}
                                </div>
                                <div className="glossary-item-caf">
                                    {t("Recommended Control", "推荐措施")}: {threat.recommendedControlIds.join(", ")}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};


type ChapterLevel = 2 | 3 | 4;

interface ChapterMeta {
    id: ChapterLevel;
    title: string;
    subtitle: string;
}


const CHAPTERS: ChapterMeta[] = [
    { id: 2, title: "Level 2 – Basic Protection", subtitle: "Essential cyber hygiene" },
    { id: 3, title: "Level 3 – Critical Business", subtitle: "Stronger security posture" },
    { id: 4, title: "Level 4 – Key Infrastructure", subtitle: "High assurance environment" },
];

const STAGES_BY_CHAPTER = {
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

type ViewType = "map" | "chapter" | "stage";

interface View {
    type: ViewType;
    chapter?: ChapterLevel;
    stageId?: string;
}

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
    // Remember which stage and language were last loaded, so we know when to fetch new data
    const [loadedForStageId, setLoadedForStageId] = useState<string | null>(null);
    const [level4Scenario, setLevel4Scenario] = useState<Level4Scenario | null>(null);
    const [gameMode, setGameMode] = useState<"beginner" | "expert">(() => {
        try {
            const saved = localStorage.getItem("gameMode");
            return saved === "expert" ? "expert" : "beginner";
        } catch {
            return "beginner";
        }
    });
    const [language, setLanguage] = useState<"en" | "zh">(() => {
        try {
            const saved = localStorage.getItem("language");
            return saved === "zh" ? "zh" : "en";
        } catch {
            return "en";
        }
    });
    const [theme, setTheme] = useState<"dark" | "light">(() => {
        try { return (localStorage.getItem("theme") as "dark" | "light") || "dark"; }
        catch { return "dark"; }
    });
    const [glossaryOpen, setGlossaryOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [briefingOpen, setBriefingOpen] = useState(true);
    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const [promotionLevel, setPromotionLevel] = useState<3 | 4 | null>(null);
    const [showIntro, setShowIntro] = useState<boolean>(() => {
        try { return !localStorage.getItem("seenIntro"); } catch { return false; }
    });
    const [introLineIndex, setIntroLineIndex] = useState(0);
    const [introReady, setIntroReady] = useState(false);
    const [showEnding, setShowEnding] = useState(false);
    const [endingLineIndex, setEndingLineIndex] = useState(0);
    const [endingReady, setEndingReady] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialIndex, setTutorialIndex] = useState(0);
    const [stageScoreDeducted, setStageScoreDeducted] = useState(false);
    const [tutorialDeployed, setTutorialDeployed] = useState<string[]>([]);
    const [forceTutorialSeen, setForceTutorialSeen] = useState<boolean>(() => {
        try { return !!localStorage.getItem("seenTutorial"); } catch { return false; }
    });

    // Translation helper
    const t = (en: string, zh: string) => language === "zh" ? zh : en;
    // Bilingual display helpers
    const controlName = (c: Control) => language === "zh" && c.nameZh ? c.nameZh : c.name;
    const threatName  = (th: Threat) => language === "zh" && th.scenarioNameZh ? th.scenarioNameZh : th.scenarioName;

    const dataLoading = view.type === "stage" && loadedForStageId !== `${view.stageId!}:${language}`;

    // Load threats and controls whenever the active stage changes
    useEffect(() => {
        if (view.type !== "stage") return;
        setTimeout(() => { setBriefingOpen(true); setStageScoreDeducted(false); }, 0);
        const config = getStageConfig(view.stageId!);
        if (!config) return;

        const stageId = view.stageId!;
        const chapter = view.chapter!;

        if (chapter === 4) {
            const SCENARIO_MAP: Record<string, string> = {
                "L4-1": "L4-B2-SCENARIO-01",
                "L4-2": "L4-B3-SCENARIO-01",
                "L4-3": "L4-B4-SCENARIO-01",
            };
            Promise.all([loadThreats(4, language), loadControls(language), loadLevel4Tree(language)]).then(
                ([allThreats, allControls, scenarios]) => {
                    setStageThreats(allThreats.filter((th) => config.threatIds.includes(th.threatId)));
                    setStageControls(allControls.filter((c) => config.availableControlIds.includes(c.controlId)));
                    const scenarioId = SCENARIO_MAP[stageId];
                    setLevel4Scenario(scenarios.find((s) => s.scenarioId === scenarioId) ?? null);
                    setLoadedForStageId(`${stageId}:${language}`);
                }
            );
        } else {
            Promise.all([loadThreats(chapter, language), loadControls(language)]).then(
                ([allThreats, allControls]) => {
                    setStageThreats(allThreats.filter((th) => config.threatIds.includes(th.threatId)));
                    setStageControls(allControls.filter((c) => config.availableControlIds.includes(c.controlId)));
                    setLevel4Scenario(null);
                    setLoadedForStageId(`${stageId}:${language}`);
                }
            );
        }
    }, [view, language]);

    useEffect(() => {
        if (!showIntro) return;
        if (introLineIndex < INTRO_LINES.length) {
            const delay = INTRO_LINES[introLineIndex].en === "" ? 300 : 700;
            const timer = setTimeout(() => setIntroLineIndex((i) => i + 1), delay);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setIntroReady(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [showIntro, introLineIndex]);

    useEffect(() => {
        if (!showEnding) return;
        if (endingLineIndex < ENDING_LINES.length) {
            const delay = ENDING_LINES[endingLineIndex].en === "" ? 400 : 900;
            const timer = setTimeout(() => setEndingLineIndex((i) => i + 1), delay);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setEndingReady(true), 1200);
            return () => clearTimeout(timer);
        }
    }, [showEnding, endingLineIndex]);

    useEffect(() => {
        if (view.type !== "map") return;
        const allDone = completedChapters.has(2) && completedChapters.has(3) && completedChapters.has(4);
        if (allDone && !localStorage.getItem("seenEnding")) {
            setTimeout(() => setShowEnding(true), 0);
        }
    }, [view, completedChapters]);

    useEffect(() => {
        if (view.type !== "map") return;
        // Ending sequence takes priority — don't show promotion at the same time
        const allDone = completedChapters.has(2) && completedChapters.has(3) && completedChapters.has(4);
        if (allDone && !localStorage.getItem("seenEnding")) return;
        const l2done = completedChapters.has(2);
        const l3done = completedChapters.has(3);
        if (l3done && !localStorage.getItem("seenPromotion_4")) {
            setTimeout(() => setPromotionLevel(4), 0);
        } else if (l2done && !localStorage.getItem("seenPromotion_3")) {
            setTimeout(() => setPromotionLevel(3), 0);
        }
    }, [view, completedChapters]);

    // Auto-trigger tutorial on first map visit (after intro, if not yet seen)
    useEffect(() => {
        if (view.type === "map" && !forceTutorialSeen && !showIntro) {
            openTutorial();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view.type, forceTutorialSeen, showIntro]);

    // Save chapter state to localStorage whenever it changes, so stage progress survives a page refresh
    useEffect(() => {
        if (!chapterState) return;
        try {
            localStorage.setItem(`chapterState_${chapterState.chapterId}`, JSON.stringify(chapterState));
        } catch { /* ignore */ }
    }, [chapterState]);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const isChapterUnlocked = (chapter: ChapterLevel) => {
        if (chapter === 2) return true;
        if (chapter === 3) return completedChapters.has(2);
        if (chapter === 4) return completedChapters.has(3);
        return true;
    };

    const handleChapterClick = (chapterId: ChapterLevel) => {
        if (!isChapterUnlocked(chapterId)) return;
        setChapterState((prev) => {
            if (prev?.chapterId === chapterId) return prev;
            try {
                const saved = localStorage.getItem(`chapterState_${chapterId}`);
                if (saved) return JSON.parse(saved) as ChapterState;
            } catch { /* ignore */ }
            return makeChapterState(chapterId);
        });
        setView({ type: "chapter", chapter: chapterId });
    };

    const isStageUnlocked = (stageId: string) => {
        // Find which chapter this stage belongs to
        for (const stages of Object.values(STAGES_BY_CHAPTER)) {
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

        // Initialize (or reuse) chapter state, restoring from localStorage if available
        let current = chapterState;
        if (!current || current.chapterId !== chapter) {
            try {
                const saved = localStorage.getItem(`chapterState_${chapter}`);
                if (saved) current = JSON.parse(saved) as ChapterState;
            } catch { /* ignore */ }
            if (!current || current.chapterId !== chapter) current = makeChapterState(chapter);
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

        const cost = control.cost * 10000;

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
        const newDeployedIds = [...deployedControlIds, controlId];

        const deployLog = `Deployed "${control.name}". Budget: £${newBudget.toLocaleString()}.`;
        const newStageState: StageGameState = {
            ...activeStageState,
            budget: newBudget,
            sectors: updatedSectors,
            deployedControlIds: newDeployedIds,
            logs: [...activeStageState.logs, deployLog],
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
    };

    const handleUndoControl = (controlId: string) => {
        if (!activeStageState || !chapterState) return;

        const control = stageControls.find((c) => c.controlId === controlId);
        if (!control) return;

        const refund = control.cost * 10000;
        const newDeployedIds = deployedControlIds.filter((id) => id !== controlId);

        const undoName = language === "zh" && control.nameZh ? control.nameZh : control.name;
        const newStageState: StageGameState = {
            ...activeStageState,
            budget: activeStageState.budget + refund,
            deployedControlIds: newDeployedIds,
            isCompleted: false,
            status: "in_progress",
            logs: [
                ...activeStageState.logs,
                `↩ Undid: ${undoName} (+£${refund.toLocaleString()})`,
            ],
        };

        setActiveStageState(newStageState);
        setDeployedControlIds(newDeployedIds);
        setChapterState((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                remainingBudget: prev.remainingBudget + refund,
                stageStates: {
                    ...prev.stageStates,
                    [activeStageState.stageId]: newStageState,
                },
            };
        });
    };

    const handleResetStage = (stageId: string) => {
        if (!chapterState) return;

        const stageState = chapterState.stageStates[stageId];
        if (!stageState) return;

        const config = getStageConfig(stageId);
        if (!config) return;

        const spent = config.budgetAllocation - stageState.budget;
        const refund = Math.max(0, spent);
        const scoreRefund = stageState.scoreDeducted ?? 0;

        const resetStageState: StageGameState = {
            ...stageState,
            budget: config.budgetAllocation,
            deployedControlIds: [],
            isCompleted: false,
            status: "not_started",
            turn: 1,
            logs: [],
            scoreDeducted: 0,
        };

        const newChapterState = {
            ...chapterState,
            remainingBudget: chapterState.remainingBudget + refund,
            score: Math.min(100, chapterState.score + scoreRefund),
            stageStates: {
                ...chapterState.stageStates,
                [stageId]: resetStageState,
            },
        };

        setChapterState(newChapterState);

        if (activeStageState?.stageId === stageId) {
            setActiveStageState(resetStageState);
            setDeployedControlIds([]);
            setStageScoreDeducted(false);
        }

        const chapter = config.chapter;
        const allStages = STAGES_BY_CHAPTER[chapter];
        const stillAllCompleted = allStages.every((s) => {
            if (s.id === stageId) return false;
            return newChapterState.stageStates[s.id]?.status === "completed";
        });
        if (!stillAllCompleted) {
            setCompletedChapters((prev) => {
                const next = new Set(prev);
                next.delete(chapter);
                localStorage.setItem("completedChapters", JSON.stringify([...next]));
                return next;
            });
        }
    };

    const handleSubmitStage = () => {
        if (!activeStageState || !chapterState) return;
        const config = getStageConfig(activeStageState.stageId);
        if (!config) return;

        // Block if any High threats are unresolved
        const unresolvedHigh: Threat[] = [];
        for (const threat of stageThreats) {
            if (threat.severity !== "High") continue;
            const mitigated = threat.recommendedControlIds.some((id) => deployedControlIds.includes(id));
            if (!mitigated) unresolvedHigh.push(threat);
        }

        if (unresolvedHigh.length > 0) {
            const firstName = language === "zh" && unresolvedHigh[0].scenarioNameZh
                ? unresolvedHigh[0].scenarioNameZh
                : unresolvedHigh[0].scenarioName;
            setFeedbackMsg(
                language === "zh"
                    ? `存在未处理的严重威胁：${firstName}。必须全部解决才能提交。`
                    : `Critical threat unresolved: ${firstName}. All high-severity threats must be addressed before submitting.`
            );
            return;
        }

        // Calculate deduction for unresolved Medium/Low (only on first submit)
        let deduction = 0;
        if (!stageScoreDeducted) {
            for (const threat of stageThreats) {
                const mitigated = threat.recommendedControlIds.some((id) =>
                    deployedControlIds.includes(id)
                );
                if (!mitigated) {
                    if (threat.severity === "Medium") deduction += 15;
                    else if (threat.severity === "Low") deduction += 5;
                }
            }
            setStageScoreDeducted(true);
        }

        const newScore = Math.max(0, chapterState.score - deduction);

        // Fail if chapter score is below passing threshold
        if (newScore < config.passingScore) {
            setChapterState({ ...chapterState, score: newScore });
            setFeedbackMsg(
                language === "zh"
                    ? `章节得分不足（${newScore}/${config.passingScore}）。请回顾之前的关卡，重置并重新部署措施。`
                    : `Chapter score too low (${newScore}/${config.passingScore}). Consider resetting an earlier stage and redeploying.`
            );
            return;
        }

        // Pass — mark stage complete
        const newStageState: StageGameState = {
            ...activeStageState,
            isCompleted: true,
            status: "completed",
            // Preserve previously stored deduction if this is a re-submit after undo
            scoreDeducted: stageScoreDeducted ? (activeStageState.scoreDeducted ?? 0) : deduction,
        };

        setActiveStageState(newStageState);
        setChapterState((prev) => {
            if (!prev) return prev;
            const updatedScore = Math.max(0, prev.score - deduction);
            const newStageStates = { ...prev.stageStates, [activeStageState.stageId]: newStageState };
            return { ...prev, score: updatedScore, stageStates: newStageStates };
        });
        setFeedbackMsg(null);

        // Check whether all stages in the chapter are now complete
        if (view.type === "stage") {
            const chapterStages = STAGES_BY_CHAPTER[view.chapter!];
            const newStageStates = { ...chapterState.stageStates, [activeStageState.stageId]: newStageState };
            const allChapterDone = chapterStages.every((s) => newStageStates[s.id]?.status === "completed");
            if (allChapterDone) {
                setCompletedChapters((prev) => {
                    const next = new Set([...prev, view.chapter!]);
                    localStorage.setItem("completedChapters", JSON.stringify([...next]));
                    return next;
                });
            }
        }
    };

    const handleInnerReset = () => {
        if (!activeStageState || !chapterState) return;
        const config = getStageConfig(activeStageState.stageId);
        if (!config) return;

        const spent = config.budgetAllocation - activeStageState.budget;
        const refund = Math.max(0, spent);

        // Refund the exact score that was deducted on submit
        const scoreRefund = activeStageState.scoreDeducted ?? 0;

        const resetStageState: StageGameState = {
            ...activeStageState,
            budget: config.budgetAllocation,
            deployedControlIds: [],
            isCompleted: false,
            status: "in_progress",
            turn: 1,
            logs: [],
            scoreDeducted: 0,
        };

        setActiveStageState(resetStageState);
        setDeployedControlIds([]);
        setStageScoreDeducted(false);
        setFeedbackMsg(null);

        setChapterState((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                remainingBudget: prev.remainingBudget + refund,
                score: Math.min(100, prev.score + scoreRefund),
                stageStates: {
                    ...prev.stageStates,
                    [activeStageState.stageId]: resetStageState,
                },
            };
        });
    };

    const openTutorial = () => {
        setTutorialIndex(0);
        setTutorialDeployed([]);
        setShowTutorial(true);
    };

    const closeTutorial = () => {
        localStorage.setItem("seenTutorial", "1");
        setForceTutorialSeen(true);
        setShowTutorial(false);
        setTutorialIndex(0);
        setTutorialDeployed([]);
    };

    const dismissIntro = () => {
        localStorage.setItem("seenIntro", "1");
        setShowIntro(false);
    };

    const dismissEnding = () => {
        localStorage.setItem("seenEnding", "1");
        setShowEnding(false);
        setEndingLineIndex(0);
        setEndingReady(false);
    };

    const goBackToMap = () => setView({ type: "map" });
    const goBackToChapter = (chapter: ChapterLevel) => {
        setFeedbackMsg(null);
        setView({ type: "chapter", chapter });
    };

    if (showIntro) {
        return (
            <div className="intro-overlay">
                <button className="intro-skip" onClick={dismissIntro}>
                    {language === "zh" ? "跳过" : "Skip"}
                </button>
                <div className="intro-content">
                    {INTRO_LINES.slice(0, introLineIndex).map((line, i) => (
                        <div
                            key={i}
                            className={`intro-line${line.en === "" ? " intro-line-spacer" : ""}`}
                        >
                            {language === "zh" ? line.zh : line.en}
                        </div>
                    ))}
                </div>
                {introReady && (
                    <button className="intro-begin" onClick={dismissIntro}>
                        {language === "zh" ? "开始" : "Begin"}
                    </button>
                )}
            </div>
        );
    }

    if (showEnding) {
        return (
            <div className="ending-overlay">
                <button className="intro-skip" onClick={dismissEnding}>
                    {language === "zh" ? "跳过" : "Skip"}
                </button>
                <div className="intro-content">
                    {ENDING_LINES.slice(0, endingLineIndex).map((line, i) => (
                        <div
                            key={i}
                            className={`intro-line${line.en === "" ? " intro-line-spacer" : ""}${i === ENDING_LINES.length - 1 ? " ending-line-final" : ""}`}
                        >
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

    if (showTutorial) {
        return (
            <div className="tutorial-fullscreen">

                {/* 左侧：说明面板 */}
                <div className="tutorial-left-panel">

                    <div className="tutorial-dots">
                        {TUTORIAL_CARDS.map((_, i) => (
                            <div key={i} className={`tutorial-dot${i === tutorialIndex ? ' active' : ''}${i < tutorialIndex ? ' done' : ''}`} />
                        ))}
                    </div>

                    <h2 className="tutorial-bubble-title">
                        {language === 'zh'
                            ? TUTORIAL_CARDS[tutorialIndex].titleZh
                            : TUTORIAL_CARDS[tutorialIndex].title}
                    </h2>
                    <p className="tutorial-bubble-text">
                        {language === 'zh'
                            ? TUTORIAL_CARDS[tutorialIndex].contentZh
                            : TUTORIAL_CARDS[tutorialIndex].content}
                    </p>

                    {TUTORIAL_CARDS[tutorialIndex].highlight && (
                        <div className={`tutorial-arrow tutorial-arrow-${TUTORIAL_CARDS[tutorialIndex].highlight}`}>
                            {TUTORIAL_CARDS[tutorialIndex].highlight === 'left' &&
                                t('← Deploy controls here', '← 在这里部署措施')}
                            {TUTORIAL_CARDS[tutorialIndex].highlight === 'right' &&
                                t('Threats & requirements →', '威胁与要求 →')}
                            {TUTORIAL_CARDS[tutorialIndex].highlight === 'center' &&
                                t('↑ Threat status here', '↑ 威胁状态在这里')}
                            {TUTORIAL_CARDS[tutorialIndex].highlight === 'bottom' &&
                                t('↓ Submit button below', '↓ 提交按钮在下方')}
                        </div>
                    )}

                    <div className="tutorial-actions">
                        <button className="tutorial-skip" onClick={closeTutorial}>
                            {t('Skip Tutorial', '跳过教程')}
                        </button>
                        <div className="tutorial-nav">
                            {tutorialIndex > 0 && (
                                <button
                                    className="tutorial-btn tutorial-btn-secondary"
                                    onClick={() => setTutorialIndex((i) => i - 1)}
                                >
                                    {t('Back', '上一步')}
                                </button>
                            )}
                            {tutorialIndex < TUTORIAL_CARDS.length - 1 ? (
                                <button
                                    className="tutorial-btn tutorial-btn-primary"
                                    onClick={() => setTutorialIndex((i) => i + 1)}
                                >
                                    {t('Next', '下一步')}
                                </button>
                            ) : (
                                <button
                                    className="tutorial-btn tutorial-btn-primary"
                                    onClick={closeTutorial}
                                >
                                    {t('Got it', '明白了')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 右侧：虚拟 Stage 预览 */}
                <div className="tutorial-right-panel">

                    {/* 模拟 TopBar */}
                    <div className="tutorial-mock-topbar">
                        <span className="tutorial-mock-topbar-title">
                            Tutorial Stage — Singularity
                        </span>
                        <span className="tutorial-mock-budget">
                            {t('Budget', '预算')}: £{(200000 - tutorialDeployed.reduce((sum, id) => {
                                const ctrl = TUTORIAL_MOCK_CONTROLS.find((c) => c.id === id);
                                return sum + (ctrl ? parseInt(ctrl.cost.replace(/[^0-9]/g, '')) : 0);
                            }, 0)).toLocaleString()}
                        </span>
                    </div>

                    <div className="tutorial-mock-stage">

                        {/* 左侧：Security Measures */}
                        <div className={`tutorial-mock-panel${TUTORIAL_CARDS[tutorialIndex].highlight === 'left' ? ' tutorial-mock-panel-highlight' : ''}`}>
                            <div className="tutorial-mock-panel-title">
                                {t('Security Measures', '安全措施')}
                            </div>
                            {TUTORIAL_MOCK_CONTROLS.map((ctrl) => {
                                const deployed = tutorialDeployed.includes(ctrl.id);
                                return (
                                    <div key={ctrl.id} className="tutorial-mock-control-row">
                                        <button
                                            className={`tutorial-mock-control-btn${deployed ? ' deployed' : ''}${ctrl.recommended && !deployed ? ' recommended' : ''}`}
                                            onClick={() => {
                                                if (deployed) {
                                                    setTutorialDeployed((prev) => prev.filter((id) => id !== ctrl.id));
                                                } else {
                                                    setTutorialDeployed((prev) => [...prev, ctrl.id]);
                                                }
                                            }}
                                        >
                                            {language === 'zh' ? ctrl.nameZh : ctrl.name}
                                            {ctrl.recommended && !deployed && ' ⭐'}
                                            {deployed && ' ✓'}
                                        </button>
                                        <span className="tutorial-mock-cost">{ctrl.cost}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 中央：Threat Status */}
                        <div className={`tutorial-mock-panel${TUTORIAL_CARDS[tutorialIndex].highlight === 'center' ? ' tutorial-mock-panel-highlight' : ''}`}>
                            <div className="tutorial-mock-panel-title">
                                {t('Threat Status', '威胁状态')}
                            </div>
                            {TUTORIAL_MOCK_THREATS.map((threat) => {
                                const mitigated = tutorialDeployed.includes(threat.requiredControlId);
                                return (
                                    <div key={threat.id} className={`tutorial-mock-threat ${mitigated ? 'mitigated' : 'unresolved'}`}>
                                        <span className="tutorial-mock-threat-name">
                                            {language === 'zh' ? threat.nameZh : threat.name}
                                        </span>
                                        <span className={`tutorial-mock-severity severity-${threat.severity.toLowerCase()}`}>
                                            {threat.severity}
                                        </span>
                                        <span className="tutorial-mock-threat-status">
                                            {mitigated
                                                ? t('✓ Resolved', '✓ 已缓解')
                                                : t('⚠ Unresolved', '⚠ 未解决')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 右侧：Requirements */}
                        <div className={`tutorial-mock-panel${TUTORIAL_CARDS[tutorialIndex].highlight === 'right' ? ' tutorial-mock-panel-highlight' : ''}`}>
                            <div className="tutorial-mock-panel-title">
                                {t('Security Requirements', '安全要求')}
                            </div>
                            {TUTORIAL_MOCK_THREATS.map((threat) => {
                                const ctrl = TUTORIAL_MOCK_CONTROLS.find((c) => c.id === threat.requiredControlId);
                                const deployed = tutorialDeployed.includes(threat.requiredControlId);
                                return (
                                    <div key={threat.id} className={`tutorial-mock-req ${deployed ? 'req-met' : 'req-unmet'}`}>
                                        {deployed ? '✓' : '✗'}{' '}
                                        {ctrl ? (language === 'zh' ? ctrl.nameZh : ctrl.name) : ''}
                                    </div>
                                );
                            })}
                            <div className="tutorial-mock-score-hint">
                                {t('High: must resolve. Medium (−15pts) if skipped.',
                                   '高风险：必须解决。中风险跳过扣15分。')}
                            </div>
                        </div>

                    </div>

                    {/* 模拟 BottomBar */}
                    <div className={`tutorial-mock-bottombar${TUTORIAL_CARDS[tutorialIndex].highlight === 'bottom' ? ' tutorial-mock-panel-highlight' : ''}`}>
                        <span className="tutorial-mock-bottombar-info">
                            {t('Chapter Score: 100/100', '章节得分：100/100')}
                        </span>
                        <button className="tutorial-mock-submit">
                            {t('Submit', '提交')}
                        </button>
                    </div>

                </div>
            </div>
        );
    }

    if (view.type === "map") {
        const completedLevelCount = [2, 3, 4].filter((lv) => completedChapters.has(lv as ChapterLevel)).length;
        const playerTitle = getPlayerTitle(completedLevelCount);
        return (
            <div className="app-root">
                <header className="top-bar">
                    <div className="top-bar-title">{t("Cybersecurity Command Center", "网络安全指挥中心")}</div>
                    <div className="top-bar-role">
                        {t(playerTitle.en, playerTitle.zh)} · Kryuger Security
                    </div>
                    <button className="glossary-btn" onClick={() => setGlossaryOpen(true)}>
                        📖 {t("Glossary", "安全图鉴")}
                    </button>
                    <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
                        ⚙ {t("Settings", "设置")}
                    </button>
                </header>
                <main className="map-container">
                    <button
                        className="chapter-card chapter-card-tutorial"
                        onClick={openTutorial}
                    >
                        <div className="chapter-icon chapter-icon-tutorial">
                            <span>?</span>
                        </div>
                        <div className="chapter-text-main">
                            {t('Tutorial', '新手教程')}
                        </div>
                        <div className="chapter-text-sub">Seed</div>
                        <div className="chapter-org-name" style={{ color: '#4ade80' }}>
                            {t('Start here', '从这里开始')}
                        </div>
                    </button>
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
                                <div className="chapter-org-name">
                                    {t(ORG_PROFILES[chapter.id].orgName, ORG_PROFILES[chapter.id].orgNameZh)}
                                </div>
                                <div className="chapter-org-type">
                                    {t(ORG_PROFILES[chapter.id].orgType, ORG_PROFILES[chapter.id].orgTypeZh)}
                                </div>
                                {!unlocked && (
                                    <div className="chapter-lock-label">
                                        🔒 {t(`Complete Level ${chapter.id - 1} to unlock`, `完成第 ${chapter.id - 1} 关解锁`)}
                                    </div>
                                )}
                                {unlocked && completed && (
                                    <div className="chapter-complete-label">{t("✓ Completed", "✓ 已完成")}</div>
                                )}
                            </button>
                        );
                    })}
                    <div className="chapter-card chapter-card-coming-soon">
                        <div className="chapter-icon chapter-icon-coming-soon">Lv.5</div>
                        <div className="chapter-text-main">Quantum Fluctuations</div>
                        <div className="chapter-text-sub">{t("Coming Soon", "即将推出")}</div>
                    </div>
                </main>
                {glossaryOpen && <GlossaryPanel language={language} onClose={() => setGlossaryOpen(false)} />}
                {settingsOpen && (
                    <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
                        <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
                            <div className="settings-header">
                                <h2>{t("Settings", "设置")}</h2>
                                <button className="settings-close" onClick={() => setSettingsOpen(false)}>✕</button>
                            </div>
                            <div className="settings-section">
                                <div className="settings-section-title">{t("Game Mode", "游戏模式")}</div>
                                <div className="settings-row">
                                    <button
                                        className={`settings-option${gameMode === "beginner" ? " active" : ""}`}
                                        onClick={() => { setGameMode("beginner"); localStorage.setItem("gameMode", "beginner"); }}
                                    >
                                        {t("Beginner", "新手")}
                                    </button>
                                    <button
                                        className={`settings-option${gameMode === "expert" ? " active" : ""}`}
                                        onClick={() => { setGameMode("expert"); localStorage.setItem("gameMode", "expert"); }}
                                    >
                                        {t("Expert", "专家")}
                                    </button>
                                </div>
                                <div className="settings-hint">
                                    {gameMode === "beginner"
                                        ? t("Recommended controls are highlighted to guide your decisions.", "推荐的安全措施会被高亮显示，帮助你做出决策。")
                                        : t("No hints. Make your own judgement.", "没有提示，依靠自己的判断。")}
                                </div>
                            </div>
                            <div className="settings-section">
                                <div className="settings-section-title">{t("Language", "语言")}</div>
                                <div className="settings-row">
                                    <button
                                        className={`settings-option${language === "en" ? " active" : ""}`}
                                        onClick={() => { setLanguage("en"); localStorage.setItem("language", "en"); }}
                                    >
                                        English
                                    </button>
                                    <button
                                        className={`settings-option${language === "zh" ? " active" : ""}`}
                                        onClick={() => { setLanguage("zh"); localStorage.setItem("language", "zh"); }}
                                    >
                                        中文
                                    </button>
                                </div>
                            </div>
                            <div className="settings-section">
                                <div className="settings-section-title">{t("Theme", "主题")}</div>
                                <div className="settings-row">
                                    <button
                                        className={`settings-option${theme === "dark" ? " active" : ""}`}
                                        onClick={() => setTheme("dark")}
                                    >
                                        {t("Dark", "深色")}
                                    </button>
                                    <button
                                        className={`settings-option${theme === "light" ? " active" : ""}`}
                                        onClick={() => setTheme("light")}
                                    >
                                        {t("Light", "浅色")}
                                    </button>
                                </div>
                            </div>
                            <div className="settings-section">
                                <div className="settings-section-title">{t("Tutorial", "新手教程")}</div>
                                <div className="settings-hint">
                                    {t("Replay the interactive tutorial on the L2-1 stage.", "在 L2-1 关卡重新播放互动教程。")}
                                </div>
                                <button
                                    className="settings-reset-tutorial-btn"
                                    onClick={() => {
                                        localStorage.removeItem("seenTutorial");
                                        setForceTutorialSeen(false);
                                        setSettingsOpen(false);
                                        openTutorial();
                                    }}
                                >
                                    {t("Replay Tutorial", "重新播放教程")}
                                </button>
                            </div>
                            <div className="settings-section">
                                <div className="settings-section-title">{t("Reset Progress", "重置进度")}</div>
                                <div className="settings-hint">
                                    {t("This will clear all completed stages and start the game from the beginning.", "这将清除所有已完成的关卡，从头开始游戏。")}
                                </div>
                                <button
                                    className="settings-reset-btn"
                                    onClick={() => {
                                        if (window.confirm(
                                            language === "zh"
                                                ? "确定要重置所有进度吗？此操作无法撤销。"
                                                : "Reset all progress? This cannot be undone."
                                        )) {
                                            localStorage.removeItem("completedChapters");
                                            localStorage.removeItem("chapterState_2");
                                            localStorage.removeItem("chapterState_3");
                                            localStorage.removeItem("chapterState_4");
                                            localStorage.removeItem("seenIntro");
                                            localStorage.removeItem("seenEnding");
                                            localStorage.removeItem("seenPromotion_3");
                                            localStorage.removeItem("seenPromotion_4");
                                            localStorage.removeItem("seenTutorial");
                                            window.location.reload();
                                        }
                                    }}
                                >
                                    {t("Reset All Progress", "重置所有进度")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {promotionLevel && (
                    <div className="promotion-overlay">
                        <div className="promotion-panel">
                            <div className="promotion-time-skip">
                                {t(PROMOTION_EVENTS[promotionLevel]!.timeSkip, PROMOTION_EVENTS[promotionLevel]!.timeSkipZh)}
                            </div>
                            <div className="promotion-title-new">
                                {t(PROMOTION_EVENTS[promotionLevel]!.newTitle, PROMOTION_EVENTS[promotionLevel]!.newTitleZh)}
                            </div>
                            <div className="promotion-divider" />
                            <blockquote className="promotion-quote">
                                "{t(PROMOTION_EVENTS[promotionLevel]!.managerQuote, PROMOTION_EVENTS[promotionLevel]!.managerQuoteZh)}"
                            </blockquote>
                            <p className="promotion-attribution">
                                — {t("Your Manager", "你的上司")}, Kryuger Security
                            </p>
                            <button
                                className="promotion-confirm"
                                onClick={() => {
                                    localStorage.setItem(`seenPromotion_${promotionLevel}`, "1");
                                    setPromotionLevel(null);
                                }}
                            >
                                {t("Continue", "继续")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (view.type === "chapter") {
        const meta = CHAPTERS.find((c) => c.id === view.chapter!)!;
        const stages = STAGES_BY_CHAPTER[view.chapter!];

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
        const knownThreatTypeSet = new Set<string>();
        for (const s of stages) {
            const label = getRiskTypeLabel(s.id);
            if (label !== "TBD") knownThreatTypeSet.add(label);
        }
        const knownThreatTypes = [...knownThreatTypeSet];

        // Panel 3: budget figures
        const totalBudget      = chapterState?.totalBudget      ?? 1000000;
        const remainingBudget  = chapterState?.remainingBudget  ?? 1000000;
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
                            <span className="stat-label">{t("Budget Left", "剩余预算")}</span>
                            <span className="stat-value">
                                £ {(chapterState?.remainingBudget ?? 1000000).toLocaleString()}
                            </span>
                        </div>
                        <div className="top-bar-stat">
                            <span className="stat-label">{t("Score", "得分")}</span>
                            <span className="stat-value">{chapterState?.score ?? 100} / 100</span>
                        </div>
                        <button className="glossary-btn" onClick={() => setGlossaryOpen(true)}>
                            📖 {t("Glossary", "安全图鉴")}
                        </button>
                    </div>
                </header>

                <main className="chapter-layout">
                    <section className="control-center">
                        <div className="control-center-header">{t("Control Room", "控制室")}</div>
                        <div className="control-center-body">
                            <div className="control-room-column">
                                <div className="control-room-box">
                                    <div className="box-title">{t("Known Security Measures", "已知安全措施")}</div>
                                    <div className="box-text">
                                        {knownControlIds.length === 0 ? (
                                            <span>{t("No controls deployed yet", "尚未部署控制措施")}</span>
                                        ) : (
                                            knownControlIds.map((id) => (
                                                <div key={id}>✓ {id}</div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="control-room-box">
                                    <div className="box-title">{t("Known Threat Types", "已知威胁类型")}</div>
                                    <div className="box-text">
                                        {knownThreatTypes.length === 0 ? (
                                            <span>{t("No threats encountered yet", "尚未遇到威胁")}</span>
                                        ) : (
                                            knownThreatTypes.map((tt) => (
                                                <div key={tt}>⚠ {tt}</div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="control-room-column">
                                <div className="control-room-box">
                                    <div className="box-title">{t("Budget Overview", "预算概览")}</div>
                                    <div className="box-text">
                                        <div>{t("Total", "总计")}:     £{totalBudget.toLocaleString()}</div>
                                        <div>{t("Remaining", "剩余")}: £{remainingBudget.toLocaleString()}</div>
                                        <div>{t("Spent", "已用")}:     £{spentBudget.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="control-room-box">
                                    <div className="box-title">{t("Score & Deductions", "得分与扣分")}</div>
                                    <div className="box-text">
                                        <div>{t("Current Score", "当前得分")}: {currentScore}/100</div>
                                        <div>{t("Passing Score", "通关分数")}: {chapterPassingScore}</div>
                                        <div>
                                            {t("Status", "状态")}:{" "}
                                            {currentScore >= chapterPassingScore
                                                ? t("✓ On track", "✓ 进展顺利")
                                                : t("⚠ At risk", "⚠ 存在风险")}
                                        </div>
                                        {(100 - currentScore) > 15 && (
                                            <div style={{ marginTop: 4, fontSize: 11, color: "#f87171" }}>
                                                {t(
                                                    "Some threats remain unmitigated — consider revisiting earlier stages.",
                                                    "存在未缓解的威胁，建议回顾之前的关卡部署。"
                                                )}
                                            </div>
                                        )}
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
                            let statusLabel;
                            if (!unlocked) {
                                statusLabel = t("🔒 Locked", "🔒 已锁定");
                            } else if (status === "completed") {
                                statusLabel = t("✓ Completed", "✓ 已完成");
                            } else if (status === "in_progress") {
                                statusLabel = t("In progress", "进行中");
                            } else {
                                statusLabel = t("Not started", "未开始");
                            }
                            let statusColor: string | undefined;
                            if (!unlocked) {
                                statusColor = "#6b7280";
                            } else if (status === "completed") {
                                statusColor = "#4ade80";
                            } else if (status === "in_progress") {
                                statusColor = "#ffb84d";
                            }
                            const cardClass = [
                                "stage-card",
                                !unlocked              ? "stage-card-locked"    : "",
                                status === "completed" ? "stage-card-completed" : "",
                            ].filter(Boolean).join(" ");
                            const hasProgress = status === "in_progress" || status === "completed";
                            return (
                                <button
                                    key={stage.id}
                                    className={cardClass}
                                    onClick={() => handleStageClick(view.chapter!, stage.id)}
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
                                    {hasProgress && (
                                        <button
                                            className="stage-reset-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleResetStage(stage.id);
                                            }}
                                        >
                                            {t("↺ Reset Stage", "↺ 重置关卡")}
                                        </button>
                                    )}
                                </button>
                            );
                        })}
                    </section>
                </main>
                {glossaryOpen && <GlossaryPanel language={language} onClose={() => setGlossaryOpen(false)} />}
            </div>
        );
    }

    // view.type === "stage"
    const chapterMeta = CHAPTERS.find((c) => c.id === view.chapter!)!;
    const stageMeta = STAGES_BY_CHAPTER[view.chapter!].find(
        (s) => s.id === view.stageId!
    )!;
    const stageConfig = getStageConfig(view.stageId!);

    const currentStageIndex = STAGES_BY_CHAPTER[view.chapter!]?.findIndex((s) => s.id === view.stageId!) ?? -1;
    const nextStage = STAGES_BY_CHAPTER[view.chapter!]?.[currentStageIndex + 1];
    const hasNextStage = !!nextStage;

    return (
        <div className="app-root">
            <header className="top-bar">
                <button className="back-button" onClick={() => goBackToChapter(view.chapter!)}>
                    ← Chapter
                </button>
                <div className="top-bar-title">{stageMeta.name}</div>
                <div className="top-bar-right">
                    <div className="top-bar-stat">
                        <span className="stat-label">Chapter</span>
                        <span className="stat-value">Lv.{chapterMeta.id}</span>
                    </div>
                    <div className="top-bar-stat">
                        <span className="stat-label">{t("Budget Left", "剩余预算")}</span>
                        <span className="stat-value">
                            £ {activeStageState ? activeStageState.budget.toLocaleString() : "200,000"}
                        </span>
                    </div>
                    <div className="top-bar-stat">
                        <span className="stat-label">{t("Chapter Score", "章节得分")}</span>
                        <span className="stat-value">
                            {chapterState ? chapterState.score : 100} / 100
                        </span>
                    </div>
                    <button className="glossary-btn" onClick={() => setGlossaryOpen(true)}>
                        📖 {t("Glossary", "安全图鉴")}
                    </button>
                </div>
            </header>

            <main className="stage-layout">
                <aside className="stage-sidebar-left">
                    <div className="sidebar-section">
                        <div className="sidebar-title">{t("Security Measures", "安全措施")}</div>
                        {dataLoading ? (
                            <div className="sidebar-loading">{t("Loading...", "加载中...")}</div>
                        ) : stageControls.length === 0 ? (
                            <div className="sidebar-loading">{t("No controls available", "无可用控制措施")}</div>
                        ) : (
                            stageControls.map((control) => {
                                const deployed = deployedControlIds.includes(control.controlId);
                                const isRecommended = stageThreats.some((th) =>
                                    th.recommendedControlIds.includes(control.controlId)
                                );
                                const cName = controlName(control);
                                let label;
                                if (deployed) {
                                    label = `${cName} ✓`;
                                } else {
                                    const prefix = gameMode === "beginner" && isRecommended ? "⭐ " : "";
                                    label = `${prefix}${cName}`;
                                }
                                if (deployed) {
                                    return (
                                        <div key={control.controlId} className="control-deployed-row">
                                            <button
                                                className="sidebar-pill sidebar-pill-deployed"
                                                disabled
                                            >
                                                {label}
                                                <span>£{(control.cost * 10000).toLocaleString()}</span>
                                            </button>
                                            <button
                                                className="undo-btn"
                                                onClick={() => handleUndoControl(control.controlId)}
                                                title={t("Undo this control", "撤回此措施")}
                                            >
                                                ↩
                                            </button>
                                        </div>
                                    );
                                }
                                return (
                                    <button
                                        key={control.controlId}
                                        className={`sidebar-pill${gameMode === "beginner" && isRecommended ? " control-recommended" : ""}`}
                                        onClick={() => handleDeployControl(control.controlId)}
                                    >
                                        {label}
                                        <span>£{(control.cost * 10000).toLocaleString()}</span>
                                    </button>
                                );
                            })
                        )}
                        {deployedControlIds.length > 0 && (
                            <button
                                className="stage-inner-reset-btn"
                                onClick={handleInnerReset}
                            >
                                {t('↺ Reset This Stage', '↺ 重置本关')}
                            </button>
                        )}
                    </div>
                </aside>

                <section className="stage-main-area">
                    {stageConfig?.briefing && (
                        <div className={`stage-briefing ${briefingOpen ? "" : "stage-briefing-collapsed"}`}>
                            <div className="stage-briefing-header" onClick={() => setBriefingOpen((p) => !p)}>
                                <span className="stage-briefing-label">{t("Mission Brief", "任务简报")}</span>
                                <span className="stage-briefing-toggle">{briefingOpen ? "▲" : "▼"}</span>
                            </div>
                            {briefingOpen && (
                                <p className="stage-briefing-text">
                                    {language === "zh" && stageConfig.briefingZh
                                        ? stageConfig.briefingZh
                                        : stageConfig.briefing}
                                </p>
                            )}
                        </div>
                    )}
                    <div className="stage-main-title">{t("Secure Area Boundaries", "安全区域边界")}</div>
                    <div className="stage-main-board">
                        {view.chapter === 4 && level4Scenario !== null ? (
                            <div className="threat-tree-panel">
                                <div className="threat-scenario-header">
                                    <div className="threat-scenario-title">
                                        {t("Scenario", "场景")}: {language === "zh" && level4Scenario.scenarioNameZh ? level4Scenario.scenarioNameZh : level4Scenario.scenarioName}
                                    </div>
                                    <div className="threat-scenario-desc">
                                        {language === "zh" && level4Scenario.descriptionZh ? level4Scenario.descriptionZh : level4Scenario.description}
                                    </div>
                                </div>
                                <div className="threat-chain-label">{t("Attack Chain", "攻击链")}</div>
                                {level4Scenario.subThreatIds.map((subId) => {
                                    const threat = stageThreats.find((th) => th.threatId === subId);
                                    const mitigated = threat
                                        ? threat.recommendedControlIds.some((id) => deployedControlIds.includes(id))
                                        : false;
                                    const deployHintControl = gameMode === "beginner" && threat
                                        ? stageControls.find((c) =>
                                            threat.recommendedControlIds.includes(c.controlId)
                                          )
                                        : undefined;
                                    return (
                                        <div
                                            key={subId}
                                            className={`threat-node ${mitigated ? "threat-node-mitigated" : "threat-node-unresolved"}`}
                                        >
                                            <div>
                                                <div className="threat-node-id">{subId}</div>
                                                <div className="threat-node-name">{threat ? threatName(threat) : subId}</div>
                                                {deployHintControl && (
                                                    <div className="threat-hint">{t("Deploy", "部署")}: {controlName(deployHintControl)}</div>
                                                )}
                                            </div>
                                            <div className={mitigated ? "threat-node-status-resolved" : "threat-node-status-unresolved"}>
                                                {mitigated ? t("✓ Mitigated", "✓ 已缓解") : t("⚠ Unresolved", "⚠ 未解决")}
                                            </div>
                                        </div>
                                    );
                                })}
                                {chapterState && stageConfig && chapterState.score < stageConfig.passingScore && (
                                    <div className="stage-status-warning">
                                        {t(
                                            `⚠ Score below passing threshold (${stageConfig.passingScore}). Deploy more controls to recover score.`,
                                            `⚠ 得分低于通关分数（${stageConfig.passingScore}）。请部署更多控制措施以恢复得分。`
                                        )}
                                    </div>
                                )}
                                {activeStageState?.isCompleted && (
                                    <div className="stage-status-success">
                                        {t(
                                            "✓ Attack Chain Neutralised! All sub-threats have been mitigated. The scenario has been contained.",
                                            "✓ 攻击链已瓦解！所有子威胁均已缓解，场景已成功遏制。"
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {activeStageState?.isCompleted && (
                                    <div className="stage-status-success">
                                        {t(
                                            "✓ Stage Complete — All required controls deployed. Proceed to the next stage.",
                                            "✓ 关卡完成——所有必要控制措施已部署。请继续进入下一关卡。"
                                        )}
                                    </div>
                                )}
                                {chapterState && stageConfig && chapterState.score < stageConfig.passingScore && (
                                    <div className="stage-status-warning">
                                        {t(
                                            `⚠ Score below passing threshold (${stageConfig.passingScore}). Deploy more controls to recover score.`,
                                            `⚠ 得分低于通关分数（${stageConfig.passingScore}）。请部署更多控制措施以恢复得分。`
                                        )}
                                    </div>
                                )}
                                <div className="threat-status-panel">
                                    <div className="threat-chain-label">{t("Threat Status", "威胁状态")}</div>
                                    {stageThreats.map((threat) => {
                                        const mitigated = threat.recommendedControlIds.some((id) =>
                                            deployedControlIds.includes(id)
                                        );
                                        const recommendedControl = gameMode === "beginner"
                                            ? stageControls.find((c) =>
                                                threat.recommendedControlIds.includes(c.controlId)
                                              )
                                            : undefined;
                                        return (
                                            <div
                                                key={threat.threatId}
                                                className={`threat-node ${mitigated ? "threat-node-mitigated" : "threat-node-unresolved"}`}
                                            >
                                                <div>
                                                    <div className="threat-node-name">{threatName(threat)}</div>
                                                    <div className="threat-node-severity">{t("Severity", "严重度")}: {threat.severity}</div>
                                                    {recommendedControl && (
                                                        <div className="threat-hint">{t("Hint: Deploy", "提示：部署")} {controlName(recommendedControl)}</div>
                                                    )}
                                                </div>
                                                <div className={mitigated ? "threat-node-status-resolved" : "threat-node-status-unresolved"}>
                                                    {mitigated ? t("✓ Mitigated", "✓ 已缓解") : t("⚠ Unresolved", "⚠ 未解决")}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {stageThreats.length === 0 && (
                                        <div className="sidebar-loading">{t("Loading threats...", "加载威胁中...")}</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </section>

                <aside className="stage-sidebar-right">
                    <div className="sidebar-section">
                        <div className="sidebar-title">{t("Security Requirements", "安全要求")}</div>
                        <div className="score-rule-hint">
                            {t(
                                'High: must resolve. Medium (−15pts) and Low (−5pts) reduce score if skipped.',
                                '高风险：必须解决。中风险(−15分)和低风险(−5分)跳过将扣分。'
                            )}
                        </div>
                        {stageConfig ? (
                            stageConfig.requiredControlIds.map((reqId) => {
                                const deployed = deployedControlIds.includes(reqId);
                                const control = stageControls.find((c) => c.controlId === reqId);
                                return (
                                    <div
                                        key={reqId}
                                        className={`sidebar-pill ${deployed ? "sidebar-pill-success" : "sidebar-pill-danger"}`}
                                    >
                                        {deployed ? "✓" : "✗"} {control ? controlName(control) : reqId}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="sidebar-loading">{t("Loading...", "加载中...")}</div>
                        )}
                    </div>
                    <div className="sidebar-section">
                        <div className="sidebar-title">{t("Threats", "威胁")}</div>
                        {dataLoading ? (
                            <div className="sidebar-loading">{t("Loading...", "加载中...")}</div>
                        ) : stageThreats.length === 0 ? (
                            <div className="sidebar-loading">{t("No threats available", "无可用威胁")}</div>
                        ) : (
                            stageThreats.map((threat) => {
                                const hintControl = gameMode === "beginner"
                                    ? stageControls.find((c) =>
                                        threat.recommendedControlIds.includes(c.controlId)
                                      )
                                    : undefined;
                                return (
                                    <div
                                        key={threat.threatId}
                                        className={`sidebar-pill ${threat.severity === "High" ? "sidebar-pill-danger" : ""}`}
                                    >
                                        <div>
                                            {threatName(threat)}
                                            {hintControl && (
                                                <div className="threat-hint">{t("Hint", "提示")}: {controlName(hintControl)}</div>
                                            )}
                                        </div>
                                        <span className="threat-severity">{threat.severity}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>
            </main>
            <BottomBar
                budget={activeStageState?.budget ?? 200000}
                score={chapterState?.score}
                isCompleted={activeStageState?.isCompleted ?? false}
                isLoading={dataLoading}
                onSubmit={handleSubmitStage}
                onRunAttackSimulation={() => {}}
                language={language}
                feedbackMsg={feedbackMsg}
                onNextStage={hasNextStage
                    ? () => handleStageClick(view.chapter!, nextStage!.id)
                    : () => goBackToChapter(view.chapter!)}
                nextStageLabel={hasNextStage
                    ? t(`→ ${nextStage!.name}`, `→ ${nextStage!.name}`)
                    : t('← Chapter Overview', '← 章节概览')}
            />
            {glossaryOpen && <GlossaryPanel language={language} onClose={() => setGlossaryOpen(false)} />}
        </div>
    );
};

export default App;
