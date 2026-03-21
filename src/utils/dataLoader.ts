// src/utils/dataLoader.ts
// Async loaders for game data files served from public/data/.

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Control {
    controlId: string;
    name: string;
    description: string;
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
    severity: "Low" | "Medium" | "High";
    description: string;
    recommendedControlIds: string[]; // split from semicolon-separated field
    cafPrinciple: string;
}

export interface Level4Scenario {
    scenarioId: string;
    level: number;
    primaryRiskType: string;
    scenarioName: string;
    severity: string;
    description: string;
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

/** Load all security controls from controls_library_level2_4.csv */
export async function loadControls(): Promise<Control[]> {
    const raw = await fetchText("controls_library_level2_4.csv");
    const lines = raw.trim().split(/\r?\n/).slice(1); // skip header

    return lines.filter((l) => l.trim()).map((line) => {
        const [controlId, name, description, cost, category, applicableRiskTypes, cafPrinciple] =
            parseCsvLine(line);
        return {
            controlId,
            name,
            description,
            cost: Number(cost),
            category,
            applicableRiskTypes: applicableRiskTypes.split(";"),
            cafPrinciple,
        };
    });
}

/** Load threats for a given level (2, 3, or 4) from the corresponding CSV. */
export async function loadThreats(level: 2 | 3 | 4): Promise<Threat[]> {
    const raw = await fetchText(`level${level}_threats.csv`);
    const lines = raw.trim().split(/\r?\n/).slice(1); // skip header

    return lines.filter((l) => l.trim()).map((line) => {
        const [threatId, lvl, riskType, scenarioName, severity, description, recommendedControlId, cafPrinciple] =
            parseCsvLine(line);
        return {
            threatId,
            level: Number(lvl),
            riskType,
            scenarioName,
            severity: severity as "Low" | "Medium" | "High",
            description,
            recommendedControlIds: recommendedControlId.split(";"),
            cafPrinciple,
        };
    });
}

/** Load Level 4 threat tree scenarios from level4_threat_trees.json */
export async function loadLevel4Tree(): Promise<Level4Scenario[]> {
    const res = await fetch("/data/level4_threat_trees.json");
    if (!res.ok) throw new Error(`Failed to load /data/level4_threat_trees.json: ${res.status}`);
    return res.json() as Promise<Level4Scenario[]>;
}
