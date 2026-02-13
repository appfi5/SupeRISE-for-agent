import { createContext, useContext, useState, type ReactNode } from "react";

export type Locale = "en" | "zh";

const translations = {
  en: {
    // Landing
    "landing.hero.title": "OpenClawWallet",
    "landing.hero.subtitle": "Secure & convenient custodial wallet service for OpenClaw Bots",
    "landing.cta.console": "Go to Console",
    "landing.cta.docs": "Documentation",
    "landing.nav.docs": "Docs",
    "landing.nav.console": "Console",
    "landing.nav.login": "Login",
    "landing.footer": "© 2025 OpenClawWallet. Built for OpenClaw.",
    "landing.feature.apikey.title": "API Key Management",
    "landing.feature.apikey.desc": "Generate and manage API Keys for your Bot with flexible access control.",
    "landing.feature.wallet.title": "Wallet Creation",
    "landing.feature.wallet.desc": "Create multi-chain custodial wallets with one click. Supports Ethereum, Polygon, BSC, and more.",
    "landing.feature.rules.title": "Spending Limits",
    "landing.feature.rules.desc": "Set daily/monthly spending limits for each wallet — safe and controlled.",
    "landing.feature.skill.title": "Plug & Play",
    "landing.feature.skill.desc": "Quickly integrate OpenClaw via the Skill plugin — zero configuration needed.",

    // Login
    "login.title": "Login",
    "login.description": "Enter your API token to access the console",
    "login.token": "Token",
    "login.token.placeholder": "Paste your token here",
    "login.submit": "Login",

    // Console
    "console.title": "Console",
    "console.nav.account": "Account",
    "console.nav.apikeys": "API Keys",
    "console.nav.wallets": "Wallets",
    "console.nav.rules": "Spending Rules",

    // Account
    "account.title": "Account Management",
    "account.info": "Basic Info",
    "account.info.desc": "Manage your account information",
    "account.email": "Email",
    "account.name": "Name",
    "account.created": "Created At",
    "account.save": "Save Changes",

    // API Keys
    "apikeys.title": "API Key Management",
    "apikeys.create": "Create API Key",
    "apikeys.created": "API Key Created",
    "apikeys.created.desc": "Copy this key now — you won't be able to see it again after closing.",
    "apikeys.create.new": "Create New API Key",
    "apikeys.create.desc": "Give your API Key a name.",
    "apikeys.name": "Name",
    "apikeys.name.placeholder": "e.g. Production",
    "apikeys.done": "Done",
    "apikeys.table.name": "Name",
    "apikeys.table.key": "Key",
    "apikeys.table.created": "Created",
    "apikeys.table.status": "Status",
    "apikeys.table.actions": "Actions",
    "apikeys.status.active": "Active",
    "apikeys.status.disabled": "Disabled",
    "apikeys.action.disable": "Disable",
    "apikeys.action.enable": "Enable",
    "apikeys.action.delete": "Delete",
    "apikeys.empty": "No API Keys yet. Click the button above to create one.",

    // Wallets
    "wallets.title": "Wallet Management",
    "wallets.create": "Create Wallet",
    "wallets.create.title": "Create New Wallet",
    "wallets.create.desc": "Select a blockchain to create a new custodial wallet.",
    "wallets.chain.placeholder": "Select chain",
    "wallets.status.active": "Active",
    "wallets.status.frozen": "Frozen",
    "wallets.detail.title": "Wallet Details",
    "wallets.detail.address": "Address",
    "wallets.detail.balance": "Balance",
    "wallets.detail.status": "Status",
    "wallets.detail.deposit": "Deposit Address",
    "wallets.detail.history": "Transaction History",
    "wallets.tx.receive": "Receive",
    "wallets.tx.send": "Send",
    "wallets.tx.confirmed": "Confirmed",
    "wallets.tx.pending": "Pending",
    "wallets.tx.empty": "No transactions yet",

    // Wallet Rules
    "rules.title": "Spending Rules",
    "rules.wallet": "Wallet",
    "rules.enabled": "Enabled",
    "rules.disabled": "Disabled",
    "rules.daily": "Daily Limit",
    "rules.monthly": "Monthly Limit",
    "rules.used": "Used",
    "rules.save": "Save Rules",

    // Docs
    "docs.nav.console": "Console",
    "docs.sidebar.quickstart": "Quick Start",
    "docs.sidebar.install": "Install Skill Plugin",
    "docs.sidebar.configure": "Configure Wallet",
    "docs.sidebar.api": "API Reference",
    "docs.sidebar.rules": "Wallet Rules",

    // Language
    "lang.en": "English",
    "lang.zh": "中文",
  },
  zh: {
    // Landing
    "landing.hero.title": "OpenClawWallet",
    "landing.hero.subtitle": "为 OpenClaw Bot 提供安全、便捷的托管钱包服务",
    "landing.cta.console": "进入控制台",
    "landing.cta.docs": "查看文档",
    "landing.nav.docs": "文档",
    "landing.nav.console": "控制台",
    "landing.nav.login": "登录",
    "landing.footer": "© 2025 OpenClawWallet. Built for OpenClaw.",
    "landing.feature.apikey.title": "API Key 管理",
    "landing.feature.apikey.desc": "为你的 Bot 生成和管理 API Key，灵活控制访问权限。",
    "landing.feature.wallet.title": "钱包创建",
    "landing.feature.wallet.desc": "一键创建多链托管钱包，支持 Ethereum、Polygon、BSC 等。",
    "landing.feature.rules.title": "消费额度控制",
    "landing.feature.rules.desc": "为每个钱包设定日/月消费限额，安全可控。",
    "landing.feature.skill.title": "即插即用",
    "landing.feature.skill.desc": "通过 Skill 插件快速接入 OpenClaw，零配置启动。",

    // Login
    "login.title": "登录",
    "login.description": "输入你的 API Token 以访问控制台",
    "login.token": "Token",
    "login.token.placeholder": "在此粘贴你的 Token",
    "login.submit": "登录",

    // Console
    "console.title": "控制台",
    "console.nav.account": "账号管理",
    "console.nav.apikeys": "API Key",
    "console.nav.wallets": "钱包管理",
    "console.nav.rules": "消费规则",

    // Account
    "account.title": "账号管理",
    "account.info": "基本信息",
    "account.info.desc": "管理你的账号信息",
    "account.email": "邮箱",
    "account.name": "名称",
    "account.created": "注册时间",
    "account.save": "保存修改",

    // API Keys
    "apikeys.title": "API Key 管理",
    "apikeys.create": "创建 API Key",
    "apikeys.created": "API Key 已创建",
    "apikeys.created.desc": "请立即复制此 Key，关闭后将无法再次查看完整内容。",
    "apikeys.create.new": "创建新的 API Key",
    "apikeys.create.desc": "为你的 API Key 取一个名称。",
    "apikeys.name": "名称",
    "apikeys.name.placeholder": "例如：Production",
    "apikeys.done": "完成",
    "apikeys.table.name": "名称",
    "apikeys.table.key": "Key",
    "apikeys.table.created": "创建时间",
    "apikeys.table.status": "状态",
    "apikeys.table.actions": "操作",
    "apikeys.status.active": "启用",
    "apikeys.status.disabled": "禁用",
    "apikeys.action.disable": "禁用",
    "apikeys.action.enable": "启用",
    "apikeys.action.delete": "删除",
    "apikeys.empty": "暂无 API Key，点击上方按钮创建",

    // Wallets
    "wallets.title": "钱包管理",
    "wallets.create": "创建钱包",
    "wallets.create.title": "创建新钱包",
    "wallets.create.desc": "选择区块链类型以创建新的托管钱包。",
    "wallets.chain.placeholder": "选择链类型",
    "wallets.status.active": "活跃",
    "wallets.status.frozen": "冻结",
    "wallets.detail.title": "钱包详情",
    "wallets.detail.address": "地址",
    "wallets.detail.balance": "余额",
    "wallets.detail.status": "状态",
    "wallets.detail.deposit": "充值地址",
    "wallets.detail.history": "交易历史",
    "wallets.tx.receive": "收款",
    "wallets.tx.send": "转账",
    "wallets.tx.confirmed": "已确认",
    "wallets.tx.pending": "待确认",
    "wallets.tx.empty": "暂无交易记录",

    // Wallet Rules
    "rules.title": "消费规则",
    "rules.wallet": "钱包",
    "rules.enabled": "已启用",
    "rules.disabled": "已禁用",
    "rules.daily": "日消费限额",
    "rules.monthly": "月消费限额",
    "rules.used": "已用",
    "rules.save": "保存规则",

    // Docs
    "docs.nav.console": "控制台",
    "docs.sidebar.quickstart": "快速开始",
    "docs.sidebar.install": "安装 Skill 插件",
    "docs.sidebar.configure": "配置钱包",
    "docs.sidebar.api": "API 参考",
    "docs.sidebar.rules": "钱包规则",

    // Language
    "lang.en": "English",
    "lang.zh": "中文",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>("en");

  const t = (key: TranslationKey): string => {
    return translations[locale][key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
