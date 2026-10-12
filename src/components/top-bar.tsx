import { Suspense } from "react";
import { LayoutDashboardIcon } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <MobileNav />
      <div className="flex items-center gap-2 md:hidden">
        <LayoutDashboardIcon className="size-5" />
        <span className="text-sm font-semibold">Workflow Dashboard</span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Suspense
          fallback={
            <div className="size-8 animate-pulse rounded-full bg-muted" />
          }
        >
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}