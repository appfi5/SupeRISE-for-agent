import { useState } from "react";
import { mockWallets, mockTransactions, type Wallet } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ArrowUpRight, ArrowDownLeft, QrCode } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const chains = ["Ethereum", "Polygon", "BSC", "Solana"] as const;

const Wallets = () => {
  const [wallets, setWallets] = useState<Wallet[]>(mockWallets);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailWallet, setDetailWallet] = useState<Wallet | null>(null);
  const { t } = useI18n();

  const handleCreate = () => {
    if (!selectedChain) return;
    const newWallet: Wallet = {
      id: String(Date.now()),
      address: `0x${Math.random().toString(16).slice(2, 42)}`,
      chain: selectedChain as Wallet["chain"],
      balance: "0.00",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    setWallets([newWallet, ...wallets]);
    setCreateOpen(false);
    setSelectedChain("");
  };

  const walletTxs = detailWallet
    ? mockTransactions.filter((tx) => tx.walletId === detailWallet.id)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("wallets.title")}</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t("wallets.create")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("wallets.create.title")}</DialogTitle>
              <DialogDescription>{t("wallets.create.desc")}</DialogDescription>
            </DialogHeader>
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger><SelectValue placeholder={t("wallets.chain.placeholder")} /></SelectTrigger>
              <SelectContent>
                {chains.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!selectedChain}>{t("wallets.create")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {wallets.map((w) => (
          <Card key={w.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailWallet(w)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{w.chain}</Badge>
                <Badge variant={w.status === "active" ? "default" : "secondary"}>
                  {w.status === "active" ? t("wallets.status.active") : t("wallets.status.frozen")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs text-muted-foreground truncate mb-2">{w.address}</p>
              <p className="text-lg font-semibold">{w.balance}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!detailWallet} onOpenChange={(o) => !o && setDetailWallet(null)}>
        <DialogContent className="max-w-lg">
          {detailWallet && (
            <>
              <DialogHeader>
                <DialogTitle>{t("wallets.detail.title")}</DialogTitle>
                <DialogDescription>{detailWallet.chain}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("wallets.detail.address")}</p>
                  <p className="font-mono text-xs break-all">{detailWallet.address}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("wallets.detail.balance")}</p>
                    <p className="font-semibold">{detailWallet.balance}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("wallets.detail.status")}</p>
                    <Badge variant={detailWallet.status === "active" ? "default" : "secondary"}>
                      {detailWallet.status === "active" ? t("wallets.status.active") : t("wallets.status.frozen")}
                    </Badge>
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-4 flex items-center gap-4">
                    <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                      <QrCode className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">{t("wallets.detail.deposit")}</p>
                      <p className="font-mono text-xs text-muted-foreground break-all">{detailWallet.address}</p>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <p className="text-sm font-medium mb-2">{t("wallets.detail.history")}</p>
                  {walletTxs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {walletTxs.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {tx.type === "receive" ? (
                                  <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                                )}
                                {tx.type === "receive" ? t("wallets.tx.receive") : t("wallets.tx.send")}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{tx.amount}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(tx.timestamp).toLocaleDateString("en-US")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={tx.status === "confirmed" ? "default" : "secondary"}>
                                {tx.status === "confirmed" ? t("wallets.tx.confirmed") : t("wallets.tx.pending")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">{t("wallets.tx.empty")}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallets;
