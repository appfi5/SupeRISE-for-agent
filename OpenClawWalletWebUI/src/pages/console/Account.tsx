import { useState } from "react";
import { mockAuth } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

const Account = () => {
  const [name, setName] = useState(mockAuth.user.name);
  const [email] = useState(mockAuth.user.email);
  const { t } = useI18n();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t("account.title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("account.info")}</CardTitle>
          <CardDescription>{t("account.info.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("account.email")}</Label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label>{t("account.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("account.created")}</Label>
            <Input value={new Date(mockAuth.user.createdAt).toLocaleDateString("en-US")} disabled />
          </div>
          <Button>{t("account.save")}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;
