// src/components/BottomBar.tsx
import React from "react";

interface BottomBarProps {
    turn: number;
    budget: number;
    onNextTurn: () => void;
    onRunAttackSimulation: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
                                                        turn,
                                                        budget,
                                                        onNextTurn,
                                                        onRunAttackSimulation,
                                                    }) => {
    const totalBudget = 100; // Simple fixed reference for now

    return (
        <footer className="bottombar">
            <div className="bottombar-left">
                <span>Turn: {turn}</span>
                <span className="bottombar-separator">|</span>
                <span>
          Budget: {budget} / {totalBudget}
        </span>
            </div>
            <div className="bottombar-right">
                <button className="btn-small btn-outline" onClick={onNextTurn}>
                    Next Turn
                </button>
                <button className="btn-small" onClick={onRunAttackSimulation}>
                    Run Attack Simulation
                </button>
            </div>
        </footer>
    );
};
