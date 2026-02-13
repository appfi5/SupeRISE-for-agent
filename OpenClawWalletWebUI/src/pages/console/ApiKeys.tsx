import { useState } from "react";
import { mockApiKeys, type ApiKey } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Copy, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const ApiKeys = () => {
  const [keys, setKeys] = useState<ApiKey[]>(mockApiKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const { t } = useI18n();

  const handleCreate = () => {
    if (!newKeyName.trim()) return;
    const newKey: ApiKey = {
      id: String(Date.now()),
      name: newKeyName,
      key: `ocw_live_sk_${Math.random().toString(36).slice(2, 22)}`,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    setCreatedKey(newKey.key);
    setKeys([newKey, ...keys]);
    setNewKeyName("");
  };

  const toggleStatus = (id: string) => {
    setKeys(keys.map((k) => (k.id === id ? { ...k, status: k.status === "active" ? "disabled" : "active" } : k)));
  };

  const deleteKey = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskKey = (key: string) => key.slice(0, 12) + "••••••••••••";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("apikeys.title")}</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setCreatedKey(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t("apikeys.create")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createdKey ? t("apikeys.created") : t("apikeys.create.new")}</DialogTitle>
              <DialogDescription>
                {createdKey ? t("apikeys.created.desc") : t("apikeys.create.desc")}
              </DialogDescription>
            </DialogHeader>
            {createdKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={createdKey} readOnly className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(createdKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>{t("apikeys.name")}</Label>
                <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder={t("apikeys.name.placeholder")} />
              </div>
            )}
            <DialogFooter>
              {createdKey ? (
                <Button onClick={() => { setDialogOpen(false); setCreatedKey(null); }}>{t("apikeys.done")}</Button>
              ) : (
                <Button onClick={handleCreate} disabled={!newKeyName.trim()}>{t("apikeys.create")}</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("apikeys.table.name")}</TableHead>
                <TableHead>{t("apikeys.table.key")}</TableHead>
                <TableHead>{t("apikeys.table.created")}</TableHead>
                <TableHead>{t("apikeys.table.status")}</TableHead>
                <TableHead className="text-right">{t("apikeys.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-xs">{visibleKeys.has(k.id) ? k.key : maskKey(k.key)}</code>
                      <button onClick={() => toggleVisibility(k.id)} className="text-muted-foreground hover:text-foreground">
                        {visibleKeys.has(k.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(k.createdAt).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={k.status === "active" ? "default" : "secondary"}>
                      {k.status === "active" ? t("apikeys.status.active") : t("apikeys.status.disabled")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => toggleStatus(k.id)}>
                      {k.status === "active" ? t("apikeys.action.disable") : t("apikeys.action.enable")}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteKey(k.id)}>
                      {t("apikeys.action.delete")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {keys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t("apikeys.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeys;
