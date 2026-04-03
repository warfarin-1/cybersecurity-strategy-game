// src/components/BottomBar.tsx
import React from "react";

interface BottomBarProps {
    budget: number;
    onSubmit: () => void;
    onRunAttackSimulation: () => void;
    isCompleted?: boolean;
    isLoading?: boolean;
    score?: number;
    language?: "en" | "zh";
    feedbackMsg?: string | null;
}

export const BottomBar: React.FC<BottomBarProps> = ({
    budget,
    onSubmit,
    onRunAttackSimulation,
    isCompleted = false,
    isLoading = false,
    score,
    language = "en",
    feedbackMsg,
}) => {
    const t = (en: string, zh: string) => language === "zh" ? zh : en;
    return (
        <footer className="bottombar">
            <div className="bottombar-left">
                <span>{t("Budget", "预算")}: £{budget.toLocaleString()}</span>
                {score !== undefined && (
                    <>
                        <span className="bottombar-separator">|</span>
                        <span>{t("Score", "得分")}: {score}/100</span>
                    </>
                )}
            </div>
            {feedbackMsg && (
                <div className="bottombar-feedback">
                    ⚠ {feedbackMsg}
                </div>
            )}
            <div className="bottombar-right">
                <button
                    className="btn-small btn-outline"
                    onClick={onSubmit}
                    disabled={isCompleted || isLoading}
                >
                    {isLoading
                        ? t("Loading...", "加载中...")
                        : isCompleted
                        ? t("✓ Stage Complete", "✓ 关卡完成")
                        : t("Submit", "提交")}
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
