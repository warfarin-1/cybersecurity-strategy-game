// src/components/BottomBar.tsx
import React from "react";

interface BottomBarProps {
    turn: number;
    budget: number;
    onNextTurn: () => void;
    onRunAttackSimulation: () => void;
    isCompleted?: boolean;
    isLoading?: boolean;
    score?: number;
    language?: "en" | "zh";
}

export const BottomBar: React.FC<BottomBarProps> = ({
    turn,
    budget,
    onNextTurn,
    onRunAttackSimulation,
    isCompleted = false,
    isLoading = false,
    score,
    language = "en",
}) => {
    const t = (en: string, zh: string) => language === "zh" ? zh : en;
    return (
        <footer className="bottombar">
            <div className="bottombar-left">
                <span>{t("Turn", "回合")}: {turn}</span>
                <span className="bottombar-separator">|</span>
                <span>{t("Budget", "预算")}: £{budget.toLocaleString()}</span>
                {score !== undefined && (
                    <>
                        <span className="bottombar-separator">|</span>
                        <span>{t("Score", "得分")}: {score}/100</span>
                    </>
                )}
            </div>
            <div className="bottombar-right">
                <button
                    className="btn-small btn-outline"
                    onClick={onNextTurn}
                    disabled={isCompleted || isLoading}
                >
                    {isLoading
                        ? t("Loading...", "加载中...")
                        : isCompleted
                        ? t("Stage Complete", "关卡完成")
                        : `${t("Next Turn", "下一回合")} (T${turn})`}
                </button>
                <button
                    className="btn-small"
                    onClick={onRunAttackSimulation}
                    disabled
                >
                    {t("Attack Sim (Coming Soon)", "攻击模拟（即将推出）")}
                </button>
            </div>
        </footer>
    );
};
