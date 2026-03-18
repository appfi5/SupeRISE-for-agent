import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "antd/es/locale";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { TRANSLATION_CATALOGS, type TranslationKey } from "./catalog";

export type OwnerLocale = "en" | "zh";

const OWNER_LOCALE_STORAGE_KEY = "superise.owner-ui.locale";
const DEFAULT_OWNER_LOCALE: OwnerLocale = "en";
const LOCALE_TAGS: Record<OwnerLocale, string> = {
  en: "en-US",
  zh: "zh-CN",
};

type TranslationParams = Record<string, string | number | null | undefined>;

type LocalizationContextValue = {
  antdLocale: Locale;
  formatDateTime: (value: string | Date | null | undefined) => string;
  formatNumber: (value: number | bigint) => string;
  formatDecimalString: (value: string) => string;
  locale: OwnerLocale;
  localeTag: string;
  setLocale: (locale: OwnerLocale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<OwnerLocale>(() => readStoredLocale());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(OWNER_LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = LOCALE_TAGS[locale];
  }, [locale]);

  const value = useMemo<LocalizationContextValue>(() => {
    const localeTag = LOCALE_TAGS[locale];
    const catalog = TRANSLATION_CATALOGS[locale];
    const numberFormatter = new Intl.NumberFormat(localeTag);
    const groupSeparator =
      numberFormatter.formatToParts(12345.6).find((part) => part.type === "group")?.value ?? ",";
    const decimalSeparator =
      numberFormatter.formatToParts(12345.6).find((part) => part.type === "decimal")?.value ?? ".";
    const antdLocale = locale === "zh" ? zhCN : enUS;

    return {
      antdLocale,
      formatDateTime: (value) => {
        if (!value) {
          return catalog["common.none"];
        }

        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
          return catalog["common.none"];
        }

        return new Intl.DateTimeFormat(localeTag, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(date);
      },
      formatNumber: (value) => numberFormatter.format(value),
      formatDecimalString: (value) => formatDecimalString(value, groupSeparator, decimalSeparator),
      locale,
      localeTag,
      setLocale,
      t: (key, params) => interpolate(catalog[key], params),
    };
  }, [locale]);

  return (
    <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextValue {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider");
  }

  return context;
}

function readStoredLocale(): OwnerLocale {
  if (typeof window === "undefined") {
    return DEFAULT_OWNER_LOCALE;
  }

  const stored = window.localStorage.getItem(OWNER_LOCALE_STORAGE_KEY);
  return stored === "zh" ? "zh" : DEFAULT_OWNER_LOCALE;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

function formatDecimalString(
  value: string,
  groupSeparator: string,
  decimalSeparator: string,
): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const negative = trimmed.startsWith("-");
  const normalized = negative ? trimmed.slice(1) : trimmed;
  const [wholePartRaw, fractionPartRaw] = normalized.split(".");
  const wholePart = wholePartRaw || "0";
  const groupedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  const fractionPart = fractionPartRaw?.replace(/0+$/, "") ?? "";
  const sign = negative ? "-" : "";

  return fractionPart
    ? `${sign}${groupedWhole}${decimalSeparator}${fractionPart}`
    : `${sign}${groupedWhole}`;
}
