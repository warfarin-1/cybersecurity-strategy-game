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
        orgName: "Meridian Retail Group",
        orgNameZh: "Meridian 零售集团",
        orgType: "Retail & E-commerce",
        orgTypeZh: "零售与电商",
        tagline: "800 employees · First compliance engagement",
        taglineZh: "800名员工 · 首次合规评估",
    },
    3: {
        orgName: "Eastbridge General Hospital",
        orgNameZh: "Eastbridge 综合医院",
        orgType: "Healthcare",
        orgTypeZh: "医疗卫生",
        tagline: "1,200 beds · EHR system going live",
        taglineZh: "1200张床位 · 电子病历系统全面上线",
    },
    4: {
        orgName: "National Grid Operations Centre",
        orgNameZh: "国家电网运营中心",
        orgType: "Critical Infrastructure",
        orgTypeZh: "关键信息基础设施",
        tagline: "Serves millions · Level 4 mandatory",
        taglineZh: "服务数百万用户 · 四级认证法定要求",
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
            "Good work on the Meridian account. You handled the basics well. We've got something bigger coming in — Eastbridge Hospital needs a full Level 3 review. I think you're ready.",
        managerQuoteZh:
            "Meridian 那边做得不错。基础工作处理得很稳。现在有个更重要的项目——Eastbridge 医院需要完整的三级评估。我觉得你准备好了。",
    },
    4: {
        unlockedLevel: 4,
        newTitle: "Senior Security Consultant",
        newTitleZh: "高级安全顾问",
        timeSkip: "Two years in.",
        timeSkipZh: "入职两年。",
        managerQuote:
            "The Grid Operations Centre has requested us specifically. Level 4. Critical infrastructure. This isn't like anything you've done before — the stakes are national.",
        managerQuoteZh:
            "国家电网运营中心点名要我们接手。四级，关键基础设施。这和你之前经历的完全不同——这次关系到整个国家。",
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
