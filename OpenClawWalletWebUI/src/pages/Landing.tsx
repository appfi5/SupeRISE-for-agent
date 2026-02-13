import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KeyRound, Wallet, ShieldCheck, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Landing = () => {
  const { t } = useI18n();

  const features = [
    { icon: KeyRound, titleKey: "landing.feature.apikey.title" as const, descKey: "landing.feature.apikey.desc" as const },
    { icon: Wallet, titleKey: "landing.feature.wallet.title" as const, descKey: "landing.feature.wallet.desc" as const },
    { icon: ShieldCheck, titleKey: "landing.feature.rules.title" as const, descKey: "landing.feature.rules.desc" as const },
    { icon: Zap, titleKey: "landing.feature.skill.title" as const, descKey: "landing.feature.skill.desc" as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-lg font-semibold tracking-tight">OpenClawWallet</span>
          <nav className="flex items-center gap-4">
            <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.nav.docs")}
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.nav.login")}
            </Link>
            <Button asChild size="sm">
              <Link to="/console">{t("landing.nav.console")}</Link>
            </Button>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t("landing.hero.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          {t("landing.hero.subtitle")}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/console">{t("landing.cta.console")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/docs">{t("landing.cta.docs")}</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.titleKey} className="border bg-card">
              <CardContent className="pt-6">
                <f.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{t(f.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(f.descKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        {t("landing.footer")}
      </footer>
    </div>
  );
};

export default Landing;
