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
    briefing: "Meridian's staff have been clicking on suspicious links in supplier emails. Three employees reported fake invoices last week. Establish basic phishing defences before the situation escalates.",
    briefingZh: "Meridian 员工最近频繁点击供应商邮件中的可疑链接，上周已有三名员工收到虚假发票。在局势恶化前建立基础钓鱼防御。",
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
    briefing: "Hundreds of staff accounts across multiple retail systems, no consistent password policy. Shared logins and stale accounts are everywhere. Time to lock things down.",
    briefingZh: "零售系统中存在大量共享账号和僵尸账户，密码策略形同虚设。是时候整顿身份与访问管理了。",
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
    briefing: "Meridian stores customer purchase records and payment references across unsecured shared drives. A minor breach here could expose thousands of customers.",
    briefingZh: "Meridian 将客户购买记录和支付信息存储在未受保护的共享驱动器上，一次小规模泄露就可能波及数千名客户。",
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
    briefing: "Meridian's office network has no segmentation — point-of-sale systems sit on the same network as staff laptops. Basic network hygiene is long overdue.",
    briefingZh: "Meridian 的办公网络毫无分段——销售终端与员工笔记本共用同一网段。基础网络安全整改早该进行了。",
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
    briefing: "Hospital administrators are receiving highly convincing spear-phishing emails impersonating the regional health authority. One wrong click could compromise patient records for thousands.",
    briefingZh: "医院管理人员正在收到伪装成地区卫生局的高度逼真鱼叉式钓鱼邮件。一次错误点击可能导致数千名患者的病历外泄。",
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
    briefing: "Eastbridge has migrated clinical records to a cloud platform, but account management is chaotic — dozens of former contractors still have active credentials. A breach through a stale account would be catastrophic.",
    briefingZh: "Eastbridge 已将临床记录迁移至云平台，但账户管理混乱——数十名前外包人员仍持有有效凭证。一旦通过僵尸账户发生入侵，后果将不堪设想。",
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
    briefing: "The hospital's EHR system holds sensitive records for over 200,000 patients. Access controls are inconsistent and audit logs are incomplete. Regulators are watching.",
    briefingZh: "医院电子病历系统存储着逾20万名患者的敏感信息。访问控制不一致，审计日志残缺不全，监管机构正在密切关注。",
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
    briefing: "Eastbridge's medical devices, administrative systems and public Wi-Fi all share the same network. An attacker who gets in anywhere gets in everywhere. Segmentation is critical.",
    briefingZh: "Eastbridge 的医疗设备、行政系统和公共 Wi-Fi 共用同一网络。攻击者只要突破任意一点便可横向渗透全局。网络分段迫在眉睫。",
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
    briefing: "Intelligence suggests a state-linked threat actor has been probing the Grid's identity infrastructure for months. Weak privileged account controls could give an attacker a direct path to operational systems. This is not a drill.",
    briefingZh: "情报显示，一个与国家关联的威胁行为者已对电网身份基础设施持续侦察数月。特权账户控制薄弱可能为攻击者提供直达运营系统的路径。这不是演练。",
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
    briefing: "Operational data flowing between control systems and field sensors has shown signs of tampering. If an attacker can manipulate grid telemetry, they can trigger cascading failures without touching the physical infrastructure.",
    briefingZh: "控制系统与现场传感器之间传输的运营数据出现篡改迹象。若攻击者能够操控电网遥测数据，无需接触任何物理设施即可触发连锁故障。",
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
    briefing: "A sophisticated intrusion attempt has been detected at the Grid's network boundary. The attackers appear to be mapping internal systems. You have one chance to contain the threat before they establish a foothold.",
    briefingZh: "电网网络边界检测到一次高度复杂的入侵尝试，攻击者似乎正在探测内部系统结构。在他们建立据点之前，你只有一次机会遏制威胁。",
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
