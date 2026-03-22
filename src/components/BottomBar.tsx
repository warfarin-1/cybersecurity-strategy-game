// src/components/BottomBar.tsx
import React from "react";

interface BottomBarProps {
    turn: number;
    budget: number;
    onNextTurn: () => void;
    onRunAttackSimulation: () => void;
    isCompleted?: boolean;
    score?: number;
}

export const BottomBar: React.FC<BottomBarProps> = ({
    turn,
    budget,
    onNextTurn,
    onRunAttackSimulation,
    isCompleted = false,
    score,
}) => {
    return (
        <footer className="bottombar">
            <div className="bottombar-left">
                <span>Turn: {turn}</span>
                <span className="bottombar-separator">|</span>
                <span>Budget: £{budget.toLocaleString()}</span>
                {score !== undefined && (
                    <>
                        <span className="bottombar-separator">|</span>
                        <span>Score: {score}/100</span>
                    </>
                )}
            </div>
            <div className="bottombar-right">
                <button
                    className="btn-small btn-outline"
                    onClick={onNextTurn}
                    disabled={isCompleted}
                >
                    {isCompleted ? "Stage Complete" : `Next Turn (T${turn})`}
                </button>
                <button
                    className="btn-small"
                    onClick={onRunAttackSimulation}
                    disabled
                >
                    Attack Sim (Coming Soon)
                </button>
            </div>
        </footer>
    );
};
