// src/utils/dataLoader.ts
// Async loaders for game data files served from public/data/.

// ─── Interfaces ──────────────────────────────────────────────────────────────

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

// ─── CSV parser ───────────────────────────────────────────────────────────────

/** Splits one CSV line into fields, correctly handling double-quoted commas. */
function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const ch of line) {
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
            fields.push(current.trim());
            current = "";
        } else {
            current += ch;
        }
    }
    fields.push(current.trim());
    return fields;
}

/** Fetches a text file from public/data/ and returns its raw content. */
async function fetchText(filename: string): Promise<string> {
    const res = await fetch(`/data/${filename}`);
    if (!res.ok) throw new Error(`Failed to load /data/${filename}: ${res.status}`);
    return res.text();
}

// ─── Loaders ─────────────────────────────────────────────────────────────────

/**
 * Load all security controls.
 * Bilingual CSV columns: ControlID, Name, Name_ZH, Description, Description_ZH,
 *                        Cost, Category, ApplicableRiskTypes, CAF_Principle
 * English CSV columns:   ControlID, Name, Description, Cost, Category,
 *                        ApplicableRiskTypes, CAF_Principle
 */
export async function loadControls(lang?: "en" | "zh"): Promise<Control[]> {
    const bilingual = lang === "zh";
    const filename = bilingual
        ? "controls_library_level2_4_bilingual.csv"
        : "controls_library_level2_4.csv";
    const raw = await fetchText(filename);
    const lines = raw.trim().split(/\r?\n/).slice(1); // skip header

    return lines.filter((l) => l.trim()).map((line) => {
        const f = parseCsvLine(line);
        if (bilingual) {
            // f[0]=ControlID  f[1]=Name     f[2]=Name_ZH
            // f[3]=Description f[4]=Description_ZH f[5]=Cost
            // f[6]=Category   f[7]=ApplicableRiskTypes f[8]=CAF_Principle
            return {
                controlId:            f[0],
                name:                 f[1],
                nameZh:               f[2],
                description:          f[3],
                descriptionZh:        f[4],
                cost:                 Number(f[5]),
                category:             f[6],
                applicableRiskTypes:  f[7].split(";"),
                cafPrinciple:         f[8],
            };
        } else {
            // f[0]=ControlID f[1]=Name f[2]=Description f[3]=Cost
            // f[4]=Category  f[5]=ApplicableRiskTypes f[6]=CAF_Principle
            return {
                controlId:            f[0],
                name:                 f[1],
                nameZh:               "",
                description:          f[2],
                descriptionZh:        "",
                cost:                 Number(f[3]),
                category:             f[4],
                applicableRiskTypes:  f[5].split(";"),
                cafPrinciple:         f[6],
            };
        }
    });
}

/**
 * Load threats for a given level.
 * Bilingual CSV columns: ThreatID, Level, RiskType, ScenarioName, ScenarioName_ZH,
 *                        Severity, Description, Description_ZH, RecommendedControlID, CAF_Principle
 * English CSV columns:   ThreatID, Level, RiskType, ScenarioName, Severity,
 *                        Description, RecommendedControlID, CAF_Principle
 */
export async function loadThreats(level: 2 | 3 | 4, lang?: "en" | "zh"): Promise<Threat[]> {
    const bilingual = lang === "zh";
    const filename = bilingual
        ? `level${level}_threats_bilingual.csv`
        : `level${level}_threats.csv`;
    const raw = await fetchText(filename);
    const lines = raw.trim().split(/\r?\n/).slice(1); // skip header

    return lines.filter((l) => l.trim()).map((line) => {
        const f = parseCsvLine(line);
        if (bilingual) {
            // f[0]=ThreatID    f[1]=Level       f[2]=RiskType
            // f[3]=ScenarioName f[4]=ScenarioName_ZH f[5]=Severity
            // f[6]=Description  f[7]=Description_ZH  f[8]=RecommendedControlID
            // f[9]=CAF_Principle
            return {
                threatId:              f[0],
                level:                 Number(f[1]),
                riskType:              f[2],
                scenarioName:          f[3],
                scenarioNameZh:        f[4],
                severity:              f[5] as "Low" | "Medium" | "High",
                description:           f[6],
                descriptionZh:         f[7],
                recommendedControlIds: f[8].split(";"),
                cafPrinciple:          f[9],
            };
        } else {
            // f[0]=ThreatID f[1]=Level    f[2]=RiskType f[3]=ScenarioName
            // f[4]=Severity f[5]=Description f[6]=RecommendedControlID f[7]=CAF_Principle
            return {
                threatId:              f[0],
                level:                 Number(f[1]),
                riskType:              f[2],
                scenarioName:          f[3],
                scenarioNameZh:        "",
                severity:              f[4] as "Low" | "Medium" | "High",
                description:           f[5],
                descriptionZh:         "",
                recommendedControlIds: f[6].split(";"),
                cafPrinciple:          f[7],
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
