import React from "react";

export const TopBar: React.FC = () => {
    // Later you can hook the "About" button to open a modal or side panel
    return (
        <header className="topbar">
            <div className="topbar-title">
                Cybersecurity Strategy Game
            </div>
            <div className="topbar-meta">
                <span>Interim Prototype</span>
                <span className="topbar-dot">•</span>
                <button className="topbar-about-btn">
                    About / Credits
                </button>
            </div>
        </header>
    );
};
