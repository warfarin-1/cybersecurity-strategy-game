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

/** Infer player rank from the number of completed chapters. */
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
