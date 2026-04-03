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
        title: "Your Mission",
        titleZh: "你的任务",
        content: "You are a cybersecurity consultant. Each stage shows real threats your client faces. Your job: deploy security controls to neutralise them — within budget. Let's walk through the interface.",
        contentZh: "你是一名网络安全顾问。每个关卡都展示了客户面临的真实威胁。你的任务是：在预算范围内部署安全措施来应对这些威胁。让我们逐步了解界面。",
        highlight: null,
    },
    {
        title: "Step 1 — Know Your Threats",
        titleZh: "第一步 — 了解威胁",
        content: "The RIGHT panel shows what threats your client faces and what controls are required. Red items are HIGH severity — you MUST resolve these or you cannot complete the stage.",
        contentZh: "右侧面板显示客户面临的威胁和必须部署的措施。红色项目是高严重性威胁——你必须解决这些威胁，否则无法完成关卡。",
        highlight: 'right',
    },
    {
        title: "Step 2 — Deploy Controls",
        titleZh: "第二步 — 部署措施",
        content: "The LEFT panel is your toolkit. Click any control to deploy it — this deducts its cost from your shared chapter budget. Deployed controls are marked with ✓. Made a mistake? Use ↩ to undo a single control and get a refund, or ↺ Reset This Stage to undo everything in the current stage. Note: resetting only affects the current stage — your progress in other stages is kept.",
        contentZh: "左侧面板是你的工具箱。点击任意措施即可部署——费用从章节共享预算中扣除。已部署的措施标有 ✓。操作有误？用 ↩ 撤回单个措施并退款，或用 ↺ 重置本关来撤销当前关卡的所有部署。注意：重置只影响当前关卡，其他关卡的进度不受影响。",
        highlight: 'left',
    },
    {
        title: "Step 3 — Check the Centre",
        titleZh: "第三步 — 查看中央面板",
        content: "The CENTRE panel shows whether each threat has been mitigated. Green means resolved. Red means still at risk. Medium and Low threats are optional — but leaving them unresolved will reduce your chapter score.",
        contentZh: "中央面板显示每个威胁是否已被缓解。绿色表示已解决，红色表示仍有风险。中低风险威胁可以不处理，但会降低章节得分。",
        highlight: 'center',
    },
    {
        title: "Step 4 — Submit When Ready",
        titleZh: "第四步 — 准备好就提交",
        content: "When all HIGH threats are resolved, click SUBMIT at the bottom of the screen. Your chapter score will be calculated — you need to stay above the passing threshold to unlock the next stage. Budget is shared across all stages in a chapter, so plan ahead.",
        contentZh: "当所有高严重性威胁解决后，点击屏幕底部的提交按钮。系统会计算章节得分——你需要保持在通过线以上才能解锁下一关。预算在整个章节中共享，请提前规划。",
        highlight: 'bottom',
    },
];
