import { NavLink, Outlet, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const DocsLayout = () => {
  const { t } = useI18n();

  const sidebarItems = [
    { label: t("docs.sidebar.quickstart"), path: "/docs" },
    { label: t("docs.sidebar.install"), path: "/docs/install-skill" },
    { label: t("docs.sidebar.configure"), path: "/docs/configure-wallet" },
    { label: t("docs.sidebar.api"), path: "/docs/api-reference" },
    { label: t("docs.sidebar.rules"), path: "/docs/wallet-rules" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            OpenClawWallet
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/console" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("docs.nav.console")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="container mx-auto flex">
        <aside className="hidden md:block w-56 shrink-0 border-r">
          <ScrollArea className="h-[calc(100vh-3.5rem)] py-6 pr-4 pl-4">
            <nav className="flex flex-col gap-1">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/docs"}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        <main className="flex-1 px-8 py-8 max-w-3xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DocsLayout;
