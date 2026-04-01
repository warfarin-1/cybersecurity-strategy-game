// src/components/StatusPanel.tsx
import React from "react";

interface StatusPanelProps {
    totalRiskScore: number;
    criticalIncidents: number;
    minorIncidents: number;
    logs: string[];
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
                                                            totalRiskScore,
                                                            criticalIncidents,
                                                            minorIncidents,
                                                            logs,
                                                        }) => {
    return (
        <aside className="status-panel">
            <h2 className="status-title">Status & Incidents</h2>

            <section className="status-summary">
                <p>
                    Total risk score: <strong>{totalRiskScore} / 100</strong>
                </p>
                <p>
                    Critical incidents: <strong>{criticalIncidents}</strong>
                </p>
                <p>
                    Minor incidents: <strong>{minorIncidents}</strong>
                </p>
            </section>

            <section className="status-logs">
                <h3>Event Log</h3>
                <div className="status-log-list">
                    {logs.map((log, index) => (
                        <div key={index} className="status-log-item">
                            {log}
                        </div>
                    ))}
                </div>
            </section>
        </aside>
    );
};
