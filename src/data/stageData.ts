// src/data/stageData.ts
// Static per-stage configuration: which threats appear and which controls are available.

// ─── Interface ────────────────────────────────────────────────────────────────

export interface StageConfig {
    stageId: string;
    stageName: string;
    chapter: 2 | 3 | 4;
    budgetAllocation: number;
    threatIds: string[];             // threats that appear in this stage
    availableControlIds: string[];   // controls shown in the sidebar (includes distractors)
    requiredControlIds: string[];    // must be deployed to pass
    passingScore: number;            // minimum score to complete the stage
}

// ─── Level 2 — Basic Protection ──────────────────────────────────────────────

const L2_1: StageConfig = {
    stageId: "L2-1",
    stageName: "Phishing Basics",
    chapter: 2,
    budgetAllocation: 200_000,
    // Phishing threats: Low → Low → Medium → High
    threatIds: ["L2-PH-01", "L2-PH-02", "L2-PH-04", "L2-PH-07"],
    availableControlIds: [
        // Core — Phishing / Awareness / Governance
        "C-AWARE-01",   // Staff Phishing Awareness Training
        "C-AWARE-02",   // Security Induction for New Starters
        "C-AWARE-03",   // Targeted Awareness for High-Risk Roles
        "C-GOV-01",     // Documented Security Policies
        "C-GOV-03",     // Incident Reporting & Escalation Procedure
        "C-SYS-03",     // Antivirus / Endpoint Protection (counters L2-PH-07)
        // Distractors — unrelated categories
        "C-NET-01",     // Perimeter Firewall Ruleset
        "C-DATA-03",    // Full Disk Encryption on Laptops
    ],
    requiredControlIds: ["C-AWARE-01", "C-AWARE-02", "C-GOV-03"],
    passingScore: 60,
};

const L2_2: StageConfig = {
    stageId: "L2-2",
    stageName: "Identity & Access",
    chapter: 2,
    budgetAllocation: 200_000,
    // IAM threats: Low → Low → Medium → High
    threatIds: ["L2-IAM-01", "L2-IAM-03", "L2-IAM-05", "L2-IAM-07"],
    availableControlIds: [
        // Core — Identity / Governance
        "C-IAM-01",     // Password Complexity Policy
        "C-IAM-02",     // Account Lockout Policy
        "C-IAM-03",     // MFA for Remote Access (counters L2-IAM-07)
        "C-IAM-06",     // Individual Named Accounts Only (counters L2-IAM-03)
        "C-GOV-02",     // Joiners-Movers-Leavers Process
        "C-IAM-08",     // Strong Identity Verification for New Accounts
        // Distractors
        "C-DATA-01",    // Data Classification Scheme
        "C-NET-04",     // VPN for Remote Access
    ],
    requiredControlIds: ["C-IAM-01", "C-IAM-02", "C-IAM-06"],
    passingScore: 60,
};

const L2_3: StageConfig = {
    stageId: "L2-3",
    stageName: "Data Handling",
    chapter: 2,
    budgetAllocation: 200_000,
    // Data threats: Low → Low → Medium → High
    threatIds: ["L2-DATA-01", "L2-DATA-03", "L2-DATA-05", "L2-DATA-07"],
    availableControlIds: [
        // Core — Data
        "C-DATA-01",    // Data Classification Scheme (counters L2-DATA-01)
        "C-DATA-04",    // Encrypted Removable Media Only (counters L2-DATA-05)
        "C-DATA-05",    // Secure Backup with Offline Copies (counters L2-DATA-07)
        "C-DATA-08",    // Cloud Storage Configuration Review (counters L2-DATA-03)
        "C-DATA-02",    // Centralised File Storage
        "C-DATA-06",    // Access Control on Shared Folders
        // Distractors
        "C-IAM-01",     // Password Complexity Policy
        "C-NET-01",     // Perimeter Firewall Ruleset
    ],
    requiredControlIds: ["C-DATA-01", "C-DATA-04", "C-DATA-05"],
    passingScore: 60,
};

const L2_4: StageConfig = {
    stageId: "L2-4",
    stageName: "Network Hygiene",
    chapter: 2,
    budgetAllocation: 200_000,
    // Network threats: Low → Low → Medium → High
    threatIds: ["L2-NET-01", "L2-NET-03", "L2-NET-04", "L2-NET-07"],
    availableControlIds: [
        // Core — Network / System
        "C-NET-01",     // Perimeter Firewall Ruleset (counters L2-NET-01)
        "C-NET-02",     // Internal Network Segmentation (counters L2-NET-04)
        "C-NET-03",     // Secure Wi-Fi Configuration (counters L2-NET-03)
        "C-NET-05",     // Network Device Hardening (counters L2-NET-07)
        "C-SYS-02",     // Patch Management Process
        "C-SYS-05",     // Remove Default and Shared System Accounts
        // Distractors
        "C-AWARE-01",   // Staff Phishing Awareness Training
        "C-DATA-01",    // Data Classification Scheme
    ],
    requiredControlIds: ["C-NET-01", "C-NET-03", "C-NET-05"],
    passingScore: 60,
};

// ─── Level 3 — Critical Business (placeholder) ───────────────────────────────

const L3_1: StageConfig = {
    stageId: "L3-1",
    stageName: "Targeted Phishing",
    chapter: 3,
    budgetAllocation: 200_000,
    threatIds: [],
    availableControlIds: [],
    requiredControlIds: [],
    passingScore: 65,
};

const L3_2: StageConfig = {
    stageId: "L3-2",
    stageName: "Cloud Identity",
    chapter: 3,
    budgetAllocation: 200_000,
    threatIds: [],
    availableControlIds: [],
    requiredControlIds: [],
    passingScore: 65,
};

const L3_3: StageConfig = {
    stageId: "L3-3",
    stageName: "Data at Scale",
    chapter: 3,
    budgetAllocation: 200_000,
    threatIds: [],
    availableControlIds: [],
    requiredControlIds: [],
    passingScore: 65,
};

const L3_4: StageConfig = {
    stageId: "L3-4",
    stageName: "Network Exposure",
    chapter: 3,
    budgetAllocation: 200_000,
    threatIds: [],
    availableControlIds: [],
    requiredControlIds: [],
    passingScore: 65,
};

// ─── Level 4 — Key Infrastructure (placeholder) ──────────────────────────────

const L4_1: StageConfig = {
    stageId: "L4-1",
    stageName: "High-Risk Identity Chain",
    chapter: 4,
    budgetAllocation: 200_000,
    threatIds: [],
    availableControlIds: [],
    requiredControlIds: [],
    passingScore: 70,
};

const L4_2: StageConfig = {
    stageId: "L4-2",
    stageName: "Large Data Exposure",
    chapter: 4,
    budgetAllocation: 200_000,
    threatIds: [],
    availableControlIds: [],
    requiredControlIds: [],
    passingScore: 70,
};

const L4_3: StageConfig = {
    stageId: "L4-3",
    stageName: "Critical Service Compromise",
    chapter: 4,
    budgetAllocation: 200_000,
    threatIds: [],
    availableControlIds: [],
    requiredControlIds: [],
    passingScore: 70,
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const STAGE_CONFIGS: Record<string, StageConfig> = {
    "L2-1": L2_1,
    "L2-2": L2_2,
    "L2-3": L2_3,
    "L2-4": L2_4,
    "L3-1": L3_1,
    "L3-2": L3_2,
    "L3-3": L3_3,
    "L3-4": L3_4,
    "L4-1": L4_1,
    "L4-2": L4_2,
    "L4-3": L4_3,
};

export function getStageConfig(stageId: string): StageConfig | undefined {
    return STAGE_CONFIGS[stageId];
}
