// src/data/narrative.ts
// Narrative / flavour data — no game logic.

export interface OrgProfile {
    orgName: string;
    orgNameZh: string;
    orgType: string;
    orgTypeZh: string;
    tagline: string;
    taglineZh: string;
}

export interface PromotionEvent {
    unlockedLevel: 2 | 3 | 4;
    managerQuote: string;
    managerQuoteZh: string;
    timeSkip: string;
    timeSkipZh: string;
    newTitle: string;
    newTitleZh: string;
}

export const ORG_PROFILES: Record<2 | 3 | 4, OrgProfile> = {
    2: {
        orgName: "Singularity",
        orgNameZh: "Singularity",
        orgType: "Retail & E-commerce",
        orgTypeZh: "零售与电商",
        tagline: "800 employees · Level 2 assessment",
        taglineZh: "800名员工 · 等保二级评估",
    },
    3: {
        orgName: "Polarized Light",
        orgNameZh: "Polarized Light",
        orgType: "Healthcare",
        orgTypeZh: "医疗卫生",
        tagline: "Regional healthcare · Level 3 assessment",
        taglineZh: "地区医疗机构 · 等保三级评估",
    },
    4: {
        orgName: "Convolutional Kernel",
        orgNameZh: "Convolutional Kernel",
        orgType: "Classification: Restricted",
        orgTypeZh: "密级：限制",
        tagline: "Level 4 mandatory",
        taglineZh: "四级认证法定要求",
    },
};

export const PROMOTION_EVENTS: Partial<Record<2 | 3 | 4, PromotionEvent>> = {
    3: {
        unlockedLevel: 3,
        newTitle: "Security Consultant",
        newTitleZh: "安全顾问",
        timeSkip: "Six months later.",
        timeSkipZh: "六个月后。",
        managerQuote:
            "Good work on the Singularity account. You handled the basics well. We've got something bigger coming in — Polarized Light needs a full Level 3 review. I think you're ready.",
        managerQuoteZh:
            "Singularity 那边做得不错。基础工作处理得很稳。现在有个更重要的项目——Polarized Light 需要完整的三级评估。我觉得你准备好了。",
    },
    4: {
        unlockedLevel: 4,
        newTitle: "Senior Security Consultant",
        newTitleZh: "高级安全顾问",
        timeSkip: "Two years in.",
        timeSkipZh: "入职两年。",
        managerQuote:
            "Convolutional Kernel has requested us specifically. Level 4. I can't tell you more than that until you're in the room. What I can tell you is that this one matters.",
        managerQuoteZh:
            "Convolutional Kernel 点名要我们接手。四级。在你进入那个房间之前我无法告诉你更多。我能告诉你的是，这次非常重要。",
    },
};

export const PLAYER_TITLES: Record<number, { en: string; zh: string }> = {
    0: { en: "Junior Security Consultant", zh: "初级安全顾问" },
    1: { en: "Security Consultant",        zh: "安全顾问" },
    2: { en: "Senior Security Consultant", zh: "高级安全顾问" },
};

/** Return the player's job title based on how many chapters they have completed. */
export function getPlayerTitle(completedLevels: number): { en: string; zh: string } {
    if (completedLevels >= 2) return PLAYER_TITLES[2];
    if (completedLevels >= 1) return PLAYER_TITLES[1];
    return PLAYER_TITLES[0];
}

export const INTRO_LINES: { en: string; zh: string }[] = [
    { en: "Nottingham. 2026.", zh: "诺丁汉，2026年。" },
    { en: "", zh: "" },
    { en: "Kryuger Security.", zh: "Kryuger Security。" },
    { en: "Boutique cybersecurity consultancy.", zh: "精品网络安全咨询公司。" },
    { en: "", zh: "" },
    { en: "You've just joined as a Junior Security Consultant.", zh: "你刚刚以初级安全顾问的身份入职。" },
    { en: "No corner office. No senior title. Not yet.", zh: "没有独立办公室，没有高级头衔。还没有。" },
    { en: "", zh: "" },
    { en: "Your first case file is on the desk.", zh: "第一份案卷已经放在你的桌上。" },
    { en: "Client: Singularity.", zh: "客户：Singularity。" },
    { en: "They need to pass a Level 2 security assessment.", zh: "他们需要通过等保二级评估。" },
    { en: "Budget's tight. Threats are real.", zh: "预算有限，威胁真实存在。" },
    { en: "", zh: "" },
    { en: "Time to get to work.", zh: "该开始工作了。" },
];

export const ENDING_LINES: { en: string; zh: string }[] = [
    { en: "Convolutional Kernel. Assessment complete.", zh: "Convolutional Kernel。评估完成。" },
    { en: "", zh: "" },
    { en: "The client sends a single line of acknowledgement.", zh: "客户发来一行确认。" },
    { en: "No names. No details. Standard procedure.", zh: "没有姓名，没有细节。标准流程。" },
    { en: "", zh: "" },
    { en: "Your manager closes the file.", zh: "你的上司合上案卷。" },
    { en: "\"Three clients. Three assessments. No breaches on our watch.\"", zh: "\"三个客户，三次评估，我们在场期间零泄露。\"" },
    { en: "", zh: "" },
    { en: "You've come a long way from that first Singularity report.", zh: "从最初那份 Singularity 报告到现在，你走了很长的路。" },
    { en: "", zh: "" },
    { en: "A new file lands on your desk.", zh: "一份新的案卷落在你的桌上。" },
    { en: "Client codename: Quantum Fluctuations.", zh: "客户代号：Quantum Fluctuations。" },
    { en: "Classification level: not yet determined.", zh: "保密等级：待定。" },
    { en: "", zh: "" },
    { en: "To be continued.", zh: "待续。" },
];

export interface TutorialCard {
    title: string;
    titleZh: string;
    content: string;
    contentZh: string;
    highlight?: 'left' | 'center' | 'right' | 'bottom' | null;
}

export const TUTORIAL_CARDS: TutorialCard[] = [
    {
        title: "Welcome to Kryuger Security",
        titleZh: "欢迎加入 Kryuger Security",
        content: "You are a cybersecurity consultant. Your job is to protect client organisations by deploying the right security controls within a limited budget. Let's walk through the basics.",
        contentZh: "你是一名网络安全顾问。你的工作是在有限预算内为客户机构部署合适的安全措施。让我们先了解一下基本操作。",
        highlight: null,
    },
    {
        title: "Security Measures (Left Panel)",
        titleZh: "安全措施（左侧面板）",
        content: "This is your toolkit. Each card is a security control you can deploy — things like firewalls, MFA, or staff training. Each one costs money. Click a control to deploy it.",
        contentZh: "这是你的工具箱。每张卡片是一项可以部署的安全措施——防火墙、多因素认证、员工培训等。每项措施都有成本，点击即可部署。",
        highlight: 'left',
    },
    {
        title: "Threat Status (Centre Panel)",
        titleZh: "威胁状态（中央面板）",
        content: "This shows the threats your client is facing. High severity threats must be resolved before you can complete the stage. Medium and low threats are optional — but leaving them unresolved will reduce your score.",
        contentZh: "这里显示客户面临的威胁。高严重性威胁必须全部解决才能通关。中低威胁可以不处理，但会扣分。",
        highlight: 'center',
    },
    {
        title: "Security Requirements (Right Panel)",
        titleZh: "安全要求（右侧面板）",
        content: "This is what the client expects. The top section shows which controls are required. A green tick means you've deployed it. A red cross means it's still missing.",
        contentZh: "这里显示客户的期望。上方列出了必须部署的安全措施。绿色勾表示已部署，红色叉表示仍缺失。",
        highlight: 'right',
    },
    {
        title: "Budget & Turns (Bottom Bar)",
        titleZh: "预算与回合（底部栏）",
        content: "Your budget is shared across all stages in a chapter — spend wisely. Click 'Next Turn' when you're ready to evaluate. Once all high threats are resolved and your score is high enough, the stage is complete.",
        contentZh: "预算在整个章节的所有关卡中共享——要合理规划。准备好后点击「下一回合」进行评估。当所有高风险威胁解决且分数达标，关卡即完成。",
        highlight: 'bottom',
    },
    {
        title: "One More Thing",
        titleZh: "还有一点",
        content: "If you run out of budget or your score drops too low, you can reset any stage and get a full refund. Use the Control Room in the chapter view to track your overall progress.",
        contentZh: "如果预算不足或分数过低，你可以重置任意关卡并获得全额退款。在章节视图的控制中心可以追踪整体进度。",
        highlight: null,
    },
    {
        title: "You're Ready",
        titleZh: "准备好了",
        content: "That's everything you need to know. Start with Level 2 — your first client is Singularity, a retail company that needs a basic security assessment. Good luck.",
        contentZh: "这就是你需要了解的全部内容。从第二关开始——你的第一个客户是 Singularity，一家需要基础安全评估的零售公司。祝你好运。",
        highlight: null,
    },
];
