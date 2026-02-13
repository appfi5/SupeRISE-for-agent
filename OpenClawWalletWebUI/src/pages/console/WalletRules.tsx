import { useState } from "react";
import { mockWallets, mockWalletRules, type WalletRule } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const WalletRules = () => {
  const [rules, setRules] = useState<WalletRule[]>(mockWalletRules);
  const { t } = useI18n();

  const updateRule = (walletId: string, updates: Partial<WalletRule>) => {
    setRules(rules.map((r) => (r.walletId === walletId ? { ...r, ...updates } : r)));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("rules.title")}</h1>
      <div className="space-y-6">
        {rules.map((rule) => {
          const wallet = mockWallets.find((w) => w.id === rule.walletId);
          if (!wallet) return null;
          const dailyPct = rule.dailyLimit > 0 ? (rule.dailyUsed / rule.dailyLimit) * 100 : 0;
          const monthlyPct = rule.monthlyLimit > 0 ? (rule.monthlyUsed / rule.monthlyLimit) * 100 : 0;

          return (
            <Card key={rule.walletId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{wallet.chain} {t("rules.wallet")}</CardTitle>
                    <CardDescription className="font-mono text-xs">{wallet.address.slice(0, 10)}...{wallet.address.slice(-6)}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`switch-${rule.walletId}`} className="text-sm">
                      {rule.enabled ? t("rules.enabled") : t("rules.disabled")}
                    </Label>
                    <Switch
                      id={`switch-${rule.walletId}`}
                      checked={rule.enabled}
                      onCheckedChange={(checked) => updateRule(rule.walletId, { enabled: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("rules.daily")}</Label>
                    <span className="text-xs text-muted-foreground">
                      {t("rules.used")} {rule.dailyUsed} / {rule.dailyLimit}
                    </span>
                  </div>
                  <Progress value={Math.min(dailyPct, 100)} className="h-2" />
                  <Input
                    type="number"
                    value={rule.dailyLimit}
                    onChange={(e) => updateRule(rule.walletId, { dailyLimit: Number(e.target.value) })}
                    disabled={!rule.enabled}
                    className="max-w-[200px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("rules.monthly")}</Label>
                    <span className="text-xs text-muted-foreground">
                      {t("rules.used")} {rule.monthlyUsed} / {rule.monthlyLimit}
                    </span>
                  </div>
                  <Progress value={Math.min(monthlyPct, 100)} className="h-2" />
                  <Input
                    type="number"
                    value={rule.monthlyLimit}
                    onChange={(e) => updateRule(rule.walletId, { monthlyLimit: Number(e.target.value) })}
                    disabled={!rule.enabled}
                    className="max-w-[200px]"
                  />
                </div>

                <Button size="sm" disabled={!rule.enabled}>{t("rules.save")}</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WalletRules;
