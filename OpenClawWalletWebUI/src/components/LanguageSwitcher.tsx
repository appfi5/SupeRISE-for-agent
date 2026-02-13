import { useI18n, type Locale } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
      <SelectTrigger className="w-auto gap-1.5 border-none shadow-none h-9 px-2 text-sm text-muted-foreground hover:text-foreground">
        <Globe className="h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t("lang.en")}</SelectItem>
        <SelectItem value="zh">{t("lang.zh")}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LanguageSwitcher;
