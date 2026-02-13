import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import DocsLayout from "./pages/docs/DocsLayout";
import QuickStart from "./pages/docs/QuickStart";
import InstallSkill from "./pages/docs/InstallSkill";
import ConfigureWallet from "./pages/docs/ConfigureWallet";
import ApiReference from "./pages/docs/ApiReference";
import WalletRulesDocs from "./pages/docs/WalletRulesDocs";
import Login from "./pages/console/Login";
import ConsoleLayout from "./pages/console/ConsoleLayout";
import Account from "./pages/console/Account";
import ApiKeys from "./pages/console/ApiKeys";
import Wallets from "./pages/console/Wallets";
import WalletRules from "./pages/console/WalletRules";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/docs" element={<DocsLayout />}>
              <Route index element={<QuickStart />} />
              <Route path="install-skill" element={<InstallSkill />} />
              <Route path="configure-wallet" element={<ConfigureWallet />} />
              <Route path="api-reference" element={<ApiReference />} />
              <Route path="wallet-rules" element={<WalletRulesDocs />} />
            </Route>
            <Route path="/console" element={<ConsoleLayout />}>
              <Route index element={<Account />} />
              <Route path="api-keys" element={<ApiKeys />} />
              <Route path="wallets" element={<Wallets />} />
              <Route path="rules" element={<WalletRules />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
