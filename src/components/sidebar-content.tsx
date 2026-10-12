"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/nav-items";

export function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());
  const channelName = `mismatch-count-${useId().replace(/:/g, "")}`;
  const [mismatchCount, setMismatchCount] = useState<number | null>(null);

  const refreshCount = useCallback(async () => {
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "mismatch");

    if (typeof count === "number") {
      setMismatchCount(count);
    }
  }, [supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void refreshCount();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void refreshCount();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, channelName, refreshCount]);

  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex h-9 items-center gap-2 px-2">
        <LayoutDashboardIcon className="size-4" />
        <span className="text-sm font-semibold">Workflow Dashboard</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const showBadge =
            item.badge === "mismatch" &&
            mismatchCount !== null &&
            mismatchCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.title}
              {showBadge ? (
                <Badge
                  variant="secondary"
                  className="ml-auto tabular-nums"
                  aria-label={`${mismatchCount} mismatched`}
                >
                  {mismatchCount}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
