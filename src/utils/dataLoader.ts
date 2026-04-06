// src/utils/dataLoader.ts
// Async loaders for game data files served from public/data/.

import Papa from 'papaparse'

// Interfaces

export interface Control {
    controlId: string;
    name: string;
    nameZh: string;
    description: string;
    descriptionZh: string;
    cost: number;
    category: string;
    applicableRiskTypes: string[];   // split from semicolon-separated field
    cafPrinciple: string;
}

export interface Threat {
    threatId: string;
    level: number;
    riskType: string;
    scenarioName: string;
    scenarioNameZh: string;
    severity: "Low" | "Medium" | "High";
    description: string;
    descriptionZh: string;
    recommendedControlIds: string[]; // split from semicolon-separated field
    cafPrinciple: string;
}

export interface Level4Scenario {
    scenarioId: string;
    level: number;
    primaryRiskType: string;
    scenarioName: string;
    scenarioNameZh: string;
    severity: string;
    description: string;
    descriptionZh: string;
    subThreatIds: string[];
    requiredControls: string[];
    cafPrinciples: string[];
}

/** Fetches a text file from public/data/ and returns its raw content. */
async function fetchText(filename: string): Promise<string> {
    const res = await fetch(`/data/${filename}`);
    if (!res.ok) throw new Error(`Failed to load /data/${filename}: ${res.status}`);
    return res.text();
}

// Data loaders

/**
 * Load all security controls from the CSV file.
 * Picks the bilingual file when language is "zh", otherwise uses the English-only file.
 * Column order differs between the two files — see the index comments below.
 */
export async function loadControls(lang?: "en" | "zh"): Promise<Control[]> {
    const bilingual = lang === "zh";
    const filename = bilingual
        ? "controls_library_level2_4_bilingual.csv"
        : "controls_library_level2_4.csv";
    const raw = await fetchText(filename);
    const result = Papa.parse<string[]>(raw, { skipEmptyLines: true });
    const rows = result.data.slice(1); // skip header row

    return rows.map((row) => {
        if (bilingual) {
            // row[0]=ControlID  row[1]=Name     row[2]=Name_ZH
            // row[3]=Description row[4]=Description_ZH row[5]=Cost
            // row[6]=Category   row[7]=ApplicableRiskTypes row[8]=CAF_Principle
            return {
                controlId:            row[0],
                name:                 row[1],
                nameZh:               row[2],
                description:          row[3],
                descriptionZh:        row[4],
                cost:                 Number(row[5]),
                category:             row[6],
                applicableRiskTypes:  row[7].split(";"),
                cafPrinciple:         row[8],
            };
        } else {
            // row[0]=ControlID row[1]=Name row[2]=Description row[3]=Cost
            // row[4]=Category  row[5]=ApplicableRiskTypes row[6]=CAF_Principle
            return {
                controlId: row[0],
                name: row[1],
                nameZh: "",
                description: row[2],
                descriptionZh: "",
                cost: Number(row[3]),
                category: row[4],
                applicableRiskTypes: row[5].split(";"),
                cafPrinciple: row[6],
            };
        }
    });
}

/**
 * Load threats for the given level (2, 3, or 4) from the CSV file.
 * Picks the bilingual file when language is "zh", otherwise uses the English-only file.
 * Column order differs between the two files — see the index comments below.
 */
export async function loadThreats(level: 2 | 3 | 4, lang?: "en" | "zh"): Promise<Threat[]> {
    const bilingual = lang === "zh";
    const filename = bilingual
        ? `level${level}_threats_bilingual.csv`
        : `level${level}_threats.csv`;
    const raw = await fetchText(filename);
    const result = Papa.parse<string[]>(raw, { skipEmptyLines: true });
    const rows = result.data.slice(1); // skip header row

    return rows.map((row) => {
        if (bilingual) {
            // row[0]=ThreatID    row[1]=Level       row[2]=RiskType
            // row[3]=ScenarioName row[4]=ScenarioName_ZH row[5]=Severity
            // row[6]=Description  row[7]=Description_ZH  row[8]=RecommendedControlID
            // row[9]=CAF_Principle
            return {
                threatId:              row[0],
                level:                 Number(row[1]),
                riskType:              row[2],
                scenarioName:          row[3],
                scenarioNameZh:        row[4],
                severity:              row[5] as "Low" | "Medium" | "High",
                description:           row[6],
                descriptionZh:         row[7],
                recommendedControlIds: row[8].split(";"),
                cafPrinciple:          row[9],
            };
        } else {
            // row[0]=ThreatID row[1]=Level    row[2]=RiskType row[3]=ScenarioName
            // row[4]=Severity row[5]=Description row[6]=RecommendedControlID row[7]=CAF_Principle
            return {
                threatId: row[0],
                level: Number(row[1]),
                riskType: row[2],
                scenarioName: row[3],
                scenarioNameZh: "",
                severity: row[4] as "Low" | "Medium" | "High",
                description: row[5],
                descriptionZh: "",
                recommendedControlIds: row[6].split(";"),
                cafPrinciple: row[7],
            };
        }
    });
}

/**
 * Load Level 4 threat tree scenarios.
 * Bilingual JSON adds scenarioName_ZH and description_ZH fields.
 */
export async function loadLevel4Tree(lang?: "en" | "zh"): Promise<Level4Scenario[]> {
    const filename = lang === "zh"
        ? "level4_threat_trees_bilingual.json"
        : "level4_threat_trees.json";
    const res = await fetch(`/data/${filename}`);
    if (!res.ok) throw new Error(`Failed to load /data/${filename}: ${res.status}`);
    const raw = await res.json() as Array<{
        scenarioId: string;
        level: number;
        primaryRiskType: string;
        scenarioName: string;
        scenarioName_ZH?: string;
        severity: string;
        description: string;
        description_ZH?: string;
        subThreatIds: string[];
        requiredControls: string[];
        cafPrinciples: string[];
    }>;
    return raw.map((s) => ({
        scenarioId:      s.scenarioId,
        level:           s.level,
        primaryRiskType: s.primaryRiskType,
        scenarioName:    s.scenarioName,
        scenarioNameZh:  s.scenarioName_ZH ?? "",
        severity:        s.severity,
        description:     s.description,
        descriptionZh:   s.description_ZH ?? "",
        subThreatIds:    s.subThreatIds,
        requiredControls: s.requiredControls,
        cafPrinciples:   s.cafPrinciples,
    }));
}
