import { GlobalOutlined } from "@ant-design/icons";
import { Select } from "antd";
import { useLocalization, type OwnerLocale } from "../localization";

type LanguageSwitcherProps = {
  size?: "large" | "middle" | "small";
};

export function LanguageSwitcher({ size = "middle" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocalization();

  return (
    <Select<OwnerLocale>
      aria-label={t("locale.switcher.aria_label")}
      className="language-switcher"
      options={[
        { label: t("locale.en"), value: "en" },
        { label: t("locale.zh"), value: "zh" },
      ]}
      prefix={<GlobalOutlined />}
      size={size}
      value={locale}
      onChange={setLocale}
    />
  );
}
