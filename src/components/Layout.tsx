// src/components/Layout.tsx
import React, { useState } from "react";
import { TopBar } from "./TopBar";
import { SidebarControls } from "./SidebarControls";
import { CommandCenter } from "./CommandCenter";
import { StatusPanel } from "./StatusPanel";
import { BottomBar } from "./BottomBar";
import type {GameState, Sector, RiskLevel} from "../types";

// Helper: map risk level to a numeric score (for display)
function riskLevelToScore(level: RiskLevel): number {
    if (level === "Low") return 30;
    if (level === "Medium") return 60;
    return 90; // High
}

// Helper: decide new risk level based on how many controls applied
function calculateRiskLevel(controlsApplied: number): RiskLevel {
    if (controlsApplied >= 3) return "Low";
    if (controlsApplied >= 1) return "Medium";
    return "High";
}

// Initial sectors for the game
const initialSectors: Sector[] = [
    {
        id: "physical",
        name: "Physical Environment",
        controlsApplied: 0,
        riskLevel: "High",
    },
    {
        id: "boundary",
        name: "Perimeter / Boundary",
        controlsApplied: 0,
        riskLevel: "High",
    },
    {
        id: "network",
        name: "Network",
        controlsApplied: 0,
        riskLevel: "High",
    },
    {
        id: "computing",
        name: "Computing Environment",
        controlsApplied: 0,
        riskLevel: "High",
    },
];

const initialGameState: GameState = {
    turn: 1,
    budget: 100,
    sectors: initialSectors,
    logs: ["[T1] Scenario initialised. Budget available: 100."],
};

export const Layout: React.FC = () => {
    // Top-level game state for the prototype
    const [gameState, setGameState] = useState<GameState>(initialGameState);

    // Deploy a generic control to a specific sector (triggered from CommandCenter)
    const handleDeployControl = (sectorId: string) => {
        const controlCost = 10; // Simple fixed cost per control

        setGameState((prev) => {
            // If we do not have enough budget, just log and return
            if (prev.budget < controlCost) {
                return {
                    ...prev,
                    logs: [
                        ...prev.logs,
                        `[T${prev.turn}] Deployment skipped: insufficient budget.`,
                    ],
                };
            }

            const updatedSectors = prev.sectors.map((sector) => {
                if (sector.id !== sectorId) return sector;

                const newControls = sector.controlsApplied + 1;
                const newRisk = calculateRiskLevel(newControls);

                return {
                    ...sector,
                    controlsApplied: newControls,
                    riskLevel: newRisk,
                };
            });

            const newBudget = prev.budget - controlCost;

            return {
                ...prev,
                budget: newBudget,
                sectors: updatedSectors,
                logs: [
                    ...prev.logs,
                    `[T${prev.turn}] Deployed control to sector "${sectorId}". New budget: ${newBudget}.`,
                ],
            };
        });
    };

    // Advance to next turn
    const handleNextTurn = () => {
        setGameState((prev) => ({
            ...prev,
            turn: prev.turn + 1,
            logs: [...prev.logs, `[T${prev.turn + 1}] New turn started.`],
        }));
    };

    // Very simple attack simulation: just log a message for now
    const handleRunAttackSimulation = () => {
        setGameState((prev) => ({
            ...prev,
            logs: [
                ...prev.logs,
                `[T${prev.turn}] Attack simulation run. (Detailed logic to be added later.)`,
            ],
        }));
    };

    // Derived values for the status panel
    const averageRiskScore =
        gameState.sectors.length === 0
            ? 0
            : Math.round(
                gameState.sectors.reduce(
                    (sum, s) => sum + riskLevelToScore(s.riskLevel),
                    0
                ) / gameState.sectors.length
            );

    // For now we keep incidents as simple placeholders
    const criticalIncidents = 0;
    const minorIncidents = 0;

    return (
        <div className="app-root">
            <TopBar />

            <div className="app-main">
                <SidebarControls />
                <CommandCenter
                    sectors={gameState.sectors}
                    onDeployControl={handleDeployControl}
                />
                <StatusPanel
                    totalRiskScore={averageRiskScore}
                    criticalIncidents={criticalIncidents}
                    minorIncidents={minorIncidents}
                    logs={gameState.logs}
                />
            </div>

            <BottomBar
                budget={gameState.budget}
                onSubmit={handleNextTurn}
                onRunAttackSimulation={handleRunAttackSimulation}
            />
        </div>
    );
};
