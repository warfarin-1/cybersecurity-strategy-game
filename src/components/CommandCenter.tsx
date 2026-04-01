// src/components/CommandCenter.tsx
import React from "react";
import type {Sector} from "../types";

interface CommandCenterProps {
    sectors: Sector[];
    onDeployControl: (sectorId: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
                                                                sectors,
                                                                onDeployControl,
                                                            }) => {
    // Later you could add more detailed view per sector
    return (
        <main className="command-center">
            <div className="command-center-header">
                <h2>Command Center Overview</h2>
                <p>Allocate controls to reduce risk across different sectors.</p>
            </div>

            <div className="sector-grid">
                {sectors.map((sector) => (
                    <div key={sector.id} className="sector-card">
                        <div className="sector-title">{sector.name}</div>
                        <div className="sector-body">
                            <p>
                                Current risk: <strong>{sector.riskLevel}</strong>
                            </p>
                            <p>Controls applied: {sector.controlsApplied}</p>
                        </div>
                        <div className="sector-footer">
                            <button className="btn-small">Details</button>
                            <button
                                className="btn-small btn-outline"
                                onClick={() => onDeployControl(sector.id)}
                            >
                                Deploy Control
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};
