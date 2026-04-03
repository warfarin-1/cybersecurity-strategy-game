// src/types.ts

// Simple risk levels for sectors
export type RiskLevel = "Low" | "Medium" | "High";

// Sector in the command center
export interface Sector {
    id: string;
    name: string;
    controlsApplied: number;
    riskLevel: RiskLevel;
}

// Whole game state kept in the top-level layout
export interface GameState {
    turn: number;
    budget: number;
    sectors: Sector[];
    logs: string[];
}

// Stage completion status
export type StageStatus = "not_started" | "in_progress" | "completed";

// Per-stage game state
export interface StageGameState {
    stageId: string;
    status: StageStatus;
    turn: number;
    budget: number;
    sectors: Sector[];
    logs: string[];
    isCompleted: boolean;
    deployedControlIds: string[];
    scoreDeducted?: number; // actual points deducted from chapter score on submit
}

// Per-chapter state tracking all its stages
export interface ChapterState {
    chapterId: number;
    totalBudget: number;
    remainingBudget: number;
    score: number;
    stageStates: Record<string, StageGameState>;
}
