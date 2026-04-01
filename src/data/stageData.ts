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
    briefing?: string;               // narrative briefing (English)
    briefingZh?: string;             // narrative briefing (Chinese)
}

// ─── Level 2 — Basic Protection ──────────────────────────────────────────────

const L2_1: StageConfig = {
    stageId: "L2-1",
    stageName: "Phishing Basics",
    chapter: 2,
    budgetAllocation: 200_000,
    // Phishing threats: Low × 2, Medium × 2, High × 1
    // L2-PH-05 added to give C-GOV-03 (required) a direct threat recommendation
    threatIds: ["L2-PH-01", "L2-PH-02", "L2-PH-04", "L2-PH-05", "L2-PH-07"],
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
    requiredControlIds: ["C-AWARE-01", "C-AWARE-02", "C-GOV-03", "C-SYS-03"],
    passingScore: 60,
    briefing: "Your first day on the Singularity account. They run a mid-sized retail operation — online storefront, warehouse logistics, eight hundred staff. Someone in accounts payable clicked a link last week. Then another person did. Then a third. The pattern is clear. Start with the basics.",
    briefingZh: "你在 Singularity 项目上的第一天。这是一家中型零售商——线上店面、仓储物流、八百名员工。上周有人点了一个链接。然后又一个人点了。然后第三个。规律很明显。从基础开始。",
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
    requiredControlIds: ["C-IAM-01", "C-IAM-02", "C-IAM-06", "C-IAM-03"],
    passingScore: 60,
    briefing: "Singularity's IT team has been adding accounts for years and deleting almost none. Former contractors, seasonal staff, a logistics partner who stopped working with them in 2023 — all still active. Nobody knows how many doors are open.",
    briefingZh: "Singularity 的 IT 团队多年来一直在添加账户，却几乎从未删除。前外包人员、季节性员工、2023年就停止合作的物流合作方——全都还处于活跃状态。没人知道有多少扇门还开着。",
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
    briefing: "Customer purchase histories. Payment references. Loyalty programme data. Singularity collects all of it and stores most of it on shared drives with no access controls. A disgruntled warehouse employee could walk out with everything. So could an attacker who got in through phishing.",
    briefingZh: "客户购买记录、支付信息、积分计划数据。Singularity 收集了所有这些，大部分存储在没有访问控制的共享驱动器上。一个心怀不满的仓库员工可以带走一切。通过钓鱼入侵的攻击者也可以。",
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
    briefing: "The point-of-sale terminals, the warehouse scanners, the staff laptops, the guest Wi-Fi — all on the same network. One compromised device is a foothold into everything else. Singularity's infrastructure grew fast and nobody stopped to think about segmentation.",
    briefingZh: "销售终端、仓库扫描仪、员工笔记本、访客 Wi-Fi——全在同一个网络上。一台被入侵的设备就是进入其他所有系统的跳板。Singularity 的基础设施扩张太快，没有人停下来考虑过网络分段。",
};

// ─── Level 3 — Critical Business ─────────────────────────────────────────────
// Note: L3 threat CSV contains no Low-severity threats (all Medium/High),
// so each stage uses Medium×3 + High×1 rather than the L2 Low×2/Med×1/High×1 mix.

const L3_1: StageConfig = {
    stageId: "L3-1",
    stageName: "Targeted Phishing",
    chapter: 3,
    budgetAllocation: 250_000,
    // Phishing threats: Medium×4 + High×2
    // L3-PH-01 Medium — Spear Phishing to Finance Team         → C-AWARE-03
    // L3-PH-03 Medium — Link to Convincing Fake Login Page     → C-IAM-03
    // L3-PH-04 Medium — Multiple Unreported Phishing Attempts  → C-GOV-03
    // L3-PH-05 Medium — Phishing Bypass of Simple Filters      → C-MON-01
    // L3-PH-06 High   — Credential Theft → Mailbox Rule Abuse  → C-MON-02
    // L3-PH-07 High   — Phishing Used to Access Cloud Admin    → C-IAM-04
    threatIds: ["L3-PH-01", "L3-PH-03", "L3-PH-04", "L3-PH-05", "L3-PH-06", "L3-PH-07"],
    availableControlIds: [
        // Core — Phishing / Awareness / Monitoring
        "C-AWARE-03",   // Targeted Awareness for High-Risk Roles  (counters L3-PH-01)
        "C-IAM-03",     // MFA for Remote Access                   (counters L3-PH-03)
        "C-GOV-03",     // Incident Reporting & Escalation          (counters L3-PH-04)
        "C-MON-01",     // Central Log Collection                   (counters L3-PH-05)
        "C-MON-02",     // Basic Alerting on Suspicious Events      (counters L3-PH-06)
        "C-IAM-04",     // MFA for Admin and High-Privilege Accounts (counters L3-PH-07)
        "C-AWARE-01",   // Staff Phishing Awareness Training
        // Distractors — plausible but address different risks
        "C-DATA-04",    // Encrypted Removable Media Only (Data category)
        "C-NET-02",     // Internal Network Segmentation  (Network category)
    ],
    requiredControlIds: ["C-AWARE-03", "C-GOV-03", "C-IAM-04", "C-MON-02"],
    passingScore: 65,
    briefing: "Polarized Light manages sensitive records for a large patient population. Someone has been sending staff emails that look exactly like internal communications from the compliance department. The timing is deliberate — they started two weeks before a major system migration. This is not opportunistic.",
    briefingZh: "Polarized Light 管理着大量患者的敏感档案。有人一直在向员工发送看起来完全像合规部门内部通讯的邮件。时机是蓄意选择的——攻击在一次重大系统迁移前两周开始。这不是机会性攻击。",
};

const L3_2: StageConfig = {
    stageId: "L3-2",
    stageName: "Cloud Identity",
    chapter: 3,
    budgetAllocation: 250_000,
    // IAM threats: Medium×4 + High×2
    // L3-IAM-01 Medium — Common Password Reuse Across Systems          → C-IAM-01
    // L3-IAM-02 Medium — No Regular Access Review                      → C-IAM-05
    // L3-IAM-05 Medium — Cloud Accounts Without Conditional Access     → C-IAM-03
    // L3-IAM-07 Medium — Self-Registered Third-Party Accounts          → C-SUP-01
    // L3-IAM-06 High   — Dormant Admin Accounts Not Removed            → C-GOV-02
    // L3-IAM-08 High   — No MFA for High-Risk Cloud Apps               → C-IAM-04
    threatIds: ["L3-IAM-01", "L3-IAM-02", "L3-IAM-05", "L3-IAM-06", "L3-IAM-07", "L3-IAM-08"],
    availableControlIds: [
        // Core — Identity / Cloud
        "C-IAM-01",     // Password Complexity Policy                (counters L3-IAM-01)
        "C-IAM-05",     // Regular Access Rights Review              (counters L3-IAM-02)
        "C-IAM-03",     // MFA for Remote Access                     (counters L3-IAM-05)
        "C-GOV-02",     // Joiners-Movers-Leavers Process            (counters L3-IAM-06)
        "C-SUP-01",     // Approved Supplier List                    (counters L3-IAM-07)
        "C-IAM-04",     // MFA for Admin and High-Privilege Accounts (counters L3-IAM-08)
        "C-MON-03",     // Regular Log Review (supports access monitoring)
        // Distractors — plausible but wrong focus
        "C-NET-01",     // Perimeter Firewall Ruleset (Network category)
        "C-DATA-01",    // Data Classification Scheme (Data category)
    ],
    requiredControlIds: ["C-IAM-04", "C-IAM-05", "C-IAM-01", "C-GOV-02"],
    passingScore: 65,
    briefing: "Polarized Light migrated to cloud-based record management eighteen months ago. The migration team did the technical work and then moved on. Nobody audited the accounts afterwards. Clinical staff, admin contractors, external consultants — the access list has not been reviewed since go-live.",
    briefingZh: "Polarized Light 在十八个月前迁移到了基于云的档案管理系统。迁移团队完成技术工作后就离开了。此后没有人审计过账户。临床人员、行政外包、外部顾问——自上线以来访问列表从未被审查过。",
};

const L3_3: StageConfig = {
    stageId: "L3-3",
    stageName: "Data at Scale",
    chapter: 3,
    budgetAllocation: 250_000,
    // Data threats: Medium×4 + High×2
    // L3-DATA-02 Medium — Large Sensitive Dataset in Personal OneDrive  → C-DATA-02
    // L3-DATA-03 Medium — Unencrypted Backups Taken Offsite on USB      → C-DATA-04
    // L3-DATA-04 Medium — Inadequate Retention Controls                 → C-DATA-01
    // L3-DATA-06 Medium — Infrequently Tested Backups                   → C-IR-02
    // L3-DATA-07 High   — Highly Sensitive Data on Shared Network Drive → C-DATA-06
    // L3-DATA-08 High   — No Clear Process for Data Breach Handling     → C-IR-01
    threatIds: ["L3-DATA-02", "L3-DATA-03", "L3-DATA-04", "L3-DATA-06", "L3-DATA-07", "L3-DATA-08"],
    availableControlIds: [
        // Core — Data protection / Resilience
        "C-DATA-02",    // Centralised File Storage              (counters L3-DATA-02)
        "C-DATA-04",    // Encrypted Removable Media Only        (counters L3-DATA-03)
        "C-DATA-01",    // Data Classification Scheme            (counters L3-DATA-04)
        "C-IR-02",      // Backup Restore Testing                (counters L3-DATA-06)
        "C-DATA-06",    // Access Control on Shared Folders      (counters L3-DATA-07)
        "C-IR-01",      // Basic Incident Response Plan          (counters L3-DATA-08)
        // Distractors — plausible but address different risks
        "C-IAM-03",     // MFA for Remote Access   (Identity category)
        "C-NET-01",     // Perimeter Firewall Ruleset (Network category)
    ],
    requiredControlIds: ["C-DATA-06", "C-DATA-02", "C-DATA-04", "C-IR-01"],
    passingScore: 65,
    briefing: "The records system holds data on over two hundred thousand individuals. Diagnostic history. Medication records. Next of kin. The kind of data that does not expire and cannot be changed after a breach. Access controls were set up during the migration and have not been revisited. Audit logs are incomplete.",
    briefingZh: "档案系统存储着逾二十万人的数据。诊断记录、用药档案、紧急联系人。这类数据不会过期，泄露后无法更改。访问控制在迁移时设置，此后从未被重新审视。审计日志残缺不全。",
};

const L3_4: StageConfig = {
    stageId: "L3-4",
    stageName: "Network Exposure",
    chapter: 3,
    budgetAllocation: 250_000,
    // Network + Endpoint threats: Medium×4 + High×2
    // L3-NET-02 Medium — Flat Network with Exposed Management Interfaces → C-NET-02
    // L3-NET-06 Medium — No Central Logging for Firewall or VPN          → C-MON-01
    // L3-END-01 Medium — Local Admin Rights for Most Staff               → C-SYS-01
    // L3-END-05 Medium — Outdated Anti-Malware Signatures                → C-SYS-03
    // L3-NET-07 High   — Malware Outbreak on Several PCs                 → C-SYS-03
    // L3-NET-09 High   — Remote Admin Interface Exposed from Internet    → C-SYS-06
    threatIds: ["L3-NET-02", "L3-NET-06", "L3-END-01", "L3-END-05", "L3-NET-07", "L3-NET-09"],
    availableControlIds: [
        // Core — Network / System hardening
        "C-NET-02",     // Internal Network Segmentation         (counters L3-NET-02)
        "C-MON-01",     // Central Log Collection                (counters L3-NET-06)
        "C-SYS-01",     // Baseline Secure Configuration         (counters L3-END-01)
        "C-SYS-03",     // Antivirus / Endpoint Protection       (counters L3-END-05, L3-NET-07)
        "C-SYS-06",     // Secure Remote Administration          (counters L3-NET-09)
        "C-NET-01",     // Perimeter Firewall Ruleset (general network hardening)
        "C-SUP-02",     // Software from Trusted Sources Only (endpoint supply chain)
        // Distractors — plausible but wrong focus
        "C-AWARE-01",   // Staff Phishing Awareness Training (Awareness category)
        "C-DATA-08",    // Cloud Storage Configuration Review (Data category)
    ],
    requiredControlIds: ["C-NET-02", "C-MON-01", "C-SYS-06", "C-SYS-03"],
    passingScore: 65,
    briefing: "Polarized Light's network was never designed for the equipment it now carries. Diagnostic devices, administrative terminals, and public-facing infrastructure share the same underlying network. The facilities team added devices over the years without consulting IT. Nobody has a complete map of what is connected to what.",
    briefingZh: "Polarized Light 的网络从未为它现在承载的设备而设计。诊断设备、行政终端和面向公众的基础设施共用同一底层网络。设施团队多年来在未咨询 IT 部门的情况下添加设备。没有人有完整的连接关系图。",
};

// ─── Level 4 — Key Infrastructure ────────────────────────────────────────────
// Scenario: L4-B2-SCENARIO-01 (IAM)
// subThreatIds drive threat-tree logic; L4-IAM-01/02 are standalone stage threats.

const L4_1: StageConfig = {
    stageId: "L4-1",
    stageName: "High-Risk Identity Chain",
    chapter: 4,
    budgetAllocation: 300_000,
    // Scenario sub-threats (tree nodes) + 2 standalone threats
    // L4-IAM-C1-R1 Medium — No MFA on Critical Cloud Admin Accounts → C-IAM-04
    // L4-IAM-C1-R2 Medium — Password Reuse with External Services   → C-IAM-01
    // L4-IAM-C1-R3 Low    — Dormant Privileged Accounts             → C-GOV-02
    // L4-IAM-01   High    — Multiple Privileged Accounts Compromised → C-IAM-04
    // L4-IAM-02   Medium  — No Separation Between Admin and User Accounts → C-IAM-07
    threatIds: ["L4-IAM-C1-R1", "L4-IAM-C1-R2", "L4-IAM-C1-R3", "L4-IAM-01", "L4-IAM-02"],
    availableControlIds: [
        // Scenario required controls
        "C-IAM-04",     // MFA for Admin and High-Privilege Accounts
        "C-IAM-01",     // Password Complexity Policy
        "C-GOV-02",     // Joiners-Movers-Leavers Process
        // Supporting controls
        "C-IAM-07",     // Privileged Access Workstations  (counters L4-IAM-02)
        "C-IAM-08",     // Strong Identity Verification for New Accounts
        // Distractors
        "C-DATA-01",    // Data Classification Scheme
        "C-NET-01",     // Perimeter Firewall Ruleset
    ],
    requiredControlIds: ["C-IAM-04", "C-IAM-01", "C-GOV-02"],
    passingScore: 70,
    briefing: "The client goes by Convolutional Kernel. That is all you have been told. The briefing documents are sparse by design. What you do know: the infrastructure they operate affects a significant number of people, and certain actors have been probing it systematically for months. Privileged access is the entry point they are looking for.",
    briefingZh: "客户代号 Convolutional Kernel。这是你被告知的全部信息。简报文件的简略是刻意为之。你所知道的是：他们运营的基础设施影响着大量人口，某些行为者已对其进行了数月的系统性侦察。特权访问是他们正在寻找的突破口。",
};

// Scenario: L4-B3-SCENARIO-01 (Data)

const L4_2: StageConfig = {
    stageId: "L4-2",
    stageName: "Large Data Exposure",
    chapter: 4,
    budgetAllocation: 300_000,
    // L4-DATA-C2-R1 High   — Publicly Accessible Cloud Storage       → C-DATA-08
    // L4-DATA-C2-R2 Medium — No Encryption for Database at Rest       → C-DATA-03
    // L4-DATA-C2-R3 Medium — Over-Broad Access to Reporting System    → C-DATA-06
    // L4-DATA-01   High    — Large-Scale Exposure of Personal Data    → C-DATA-06
    // L4-DATA-03   Medium  — Untracked Copies of Highly Confidential Data → C-DATA-02
    threatIds: ["L4-DATA-C2-R1", "L4-DATA-C2-R2", "L4-DATA-C2-R3", "L4-DATA-01", "L4-DATA-03"],
    availableControlIds: [
        // Scenario required controls
        "C-DATA-08",    // Cloud Storage Configuration Review
        "C-DATA-03",    // Full Disk Encryption on Laptops
        "C-DATA-06",    // Access Control on Shared Folders
        // Supporting controls
        "C-DATA-02",    // Centralised File Storage           (counters L4-DATA-03)
        "C-DATA-05",    // Secure Backup with Offline Copies
        // Distractors
        "C-IAM-01",     // Password Complexity Policy
        "C-NET-02",     // Internal Network Segmentation
    ],
    requiredControlIds: ["C-DATA-08", "C-DATA-03", "C-DATA-06"],
    passingScore: 70,
    briefing: "The systems you are looking at don't store personal records or financial data. They store operational telemetry — readings, states, commands. If that data can be manipulated, the consequences are not a data breach. They are something considerably worse. Signs of tampering have already been detected.",
    briefingZh: "你面对的系统不存储个人档案或财务数据。它们存储运营遥测数据——读数、状态、指令。如果这些数据被篡改，后果不是数据泄露，而是严重得多的事情。篡改迹象已经被检测到。",
};

// Scenario: L4-B4-SCENARIO-01 (Network)

const L4_3: StageConfig = {
    stageId: "L4-3",
    stageName: "Critical Service Compromise",
    chapter: 4,
    budgetAllocation: 300_000,
    // L4-NET-C3-R1 Medium — Critical Vulnerability on Internet-Facing Service → C-SYS-02
    // L4-NET-C3-R2 Medium — Weak Segmentation Around Critical System          → C-NET-02
    // L4-NET-C3-R3 Low    — Limited Logging of Access to Critical System       → C-MON-01
    // L4-NET-01   High    — Critical System Directly Exposed to Internet       → C-SYS-06
    // L4-NET-04   Medium  — Inadequate Monitoring of Critical Network Segments → C-MON-01
    threatIds: ["L4-NET-C3-R1", "L4-NET-C3-R2", "L4-NET-C3-R3", "L4-NET-01", "L4-NET-04"],
    availableControlIds: [
        // Scenario required controls
        "C-SYS-02",     // Patch Management Process
        "C-NET-02",     // Internal Network Segmentation
        "C-MON-01",     // Central Log Collection
        // Supporting controls
        "C-SYS-01",     // Baseline Secure Configuration
        "C-SYS-06",     // Secure Remote Administration      (counters L4-NET-01)
        // Distractors
        "C-IAM-04",     // MFA for Admin and High-Privilege Accounts
        "C-DATA-06",    // Access Control on Shared Folders
    ],
    requiredControlIds: ["C-SYS-02", "C-NET-02", "C-MON-01"],
    passingScore: 70,
    briefing: "An intrusion attempt has been detected at the network boundary. The behaviour is consistent with reconnaissance — they are not trying to extract data yet. They are mapping. Once they have a complete picture of the internal topology, the next move will be fast. You need to contain this before that happens.",
    briefingZh: "网络边界检测到一次入侵尝试。行为特征与侦察一致——他们还没有试图提取数据，他们在绘图。一旦他们掌握了内部拓扑的完整图景，下一步行动将会很快。你需要在此之前遏制它。",
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
