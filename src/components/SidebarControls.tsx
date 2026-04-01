import React from "react";

export const SidebarControls: React.FC = () => {
    // Later you will replace these with dynamic lists: controls, policies, etc.
    return (
        <aside className="sidebar">
            <h2 className="sidebar-title">Controls & Actions</h2>

            <section className="sidebar-section">
                <h3>Deployment</h3>
                <button className="btn-block">Add Firewall</button>
                <button className="btn-block">Enable Encryption</button>
                <button className="btn-block">User Training</button>
            </section>

            <section className="sidebar-section">
                <h3>Scenarios</h3>
                <button className="btn-block btn-secondary">CAF Focus</button>
                <button className="btn-block btn-secondary">Deng Bao Focus</button>
                <button className="btn-block btn-secondary">Mixed Scenario</button>
            </section>

            <section className="sidebar-section">
                <h3>Info</h3>
                <button className="btn-block btn-ghost">Open Glossary</button>
                <button className="btn-block btn-ghost">View Tutorial</button>
            </section>
        </aside>
    );
};
