import { Outlet, Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { User, KeyRound, Wallet, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const ConsoleLayout = () => {
  const { t } = useI18n();

  const navItems = [
    { title: t("console.nav.account"), url: "/console", icon: User },
    { title: t("console.nav.apikeys"), url: "/console/api-keys", icon: KeyRound },
    { title: t("console.nav.wallets"), url: "/console/wallets", icon: Wallet },
    { title: t("console.nav.rules"), url: "/console/rules", icon: ShieldCheck },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r">
          <div className="flex h-14 items-center border-b px-4">
            <Link to="/" className="text-sm font-semibold tracking-tight">
              OpenClawWallet
            </Link>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t("console.title")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/console"}
                          className="hover:bg-muted/50"
                          activeClassName="bg-muted text-foreground font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">{t("console.title")}</span>
            </div>
            <LanguageSwitcher />
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ConsoleLayout;
