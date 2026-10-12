"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MailWarningIcon,
  SearchIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderDetail } from "@/components/orders/order-detail";
import { EmptyState } from "@/components/data-states";
import { stageAbbr } from "@/lib/stages";
import {
  asString,
  formatTimestamp,
  getOrderKey,
  getStages,
  type Order,
} from "@/lib/orders";

export type MismatchRow = Order & { attachment?: string | null };

function ExtractedChips({ order }: { order: Order }) {
  const chips = useMemo(() => {
    const result: Array<{ key: string; label: string }> = [];
    for (const { stage, state } of getStages(order)) {
      const abbr = stageAbbr(stage);
      if (state.number) {
        result.push({ key: `${stage.key}-number`, label: `${abbr} ${state.number}` });
      }
      if (state.date) {
        result.push({ key: `${stage.key}-date`, label: `${abbr} ${state.date}` });
      }
    }
    return result;
  }, [order]);

  if (chips.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex max-w-xs flex-wrap gap-1">
      {chips.map((chip) => (
        <Badge key={chip.key} variant="secondary">
          {chip.label}
        </Badge>
      ))}
    </div>
  );
}

export function MismatchTable({
  rows,
  total,
  page,
  pageSize,
  query,
}: {
  rows: MismatchRow[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("orders-mismatch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const selected = useMemo(
    () => rows.find((row) => getOrderKey(row) === selectedKey) ?? null,
    [rows, selectedKey]
  );

  function navigate(nextQuery: string, nextPage: number) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextPage > 1) params.set("page", String(nextPage));
    const search = params.toString();
    router.push(search ? `${pathname}?${search}` : pathname);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = String(data.get("q") ?? "");
    navigate(value, 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={query}
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search invoice, PI, BL, email..."
            className="pl-8"
            aria-label="Search mismatches"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
        <span className="ml-auto hidden text-sm text-muted-foreground sm:block">
          {total} email{total === 1 ? "" : "s"}
        </span>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={MailWarningIcon}
          title="No mismatched emails"
          description={
            query
              ? "No mismatches match your search."
              : "Unmatched emails will appear here."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Received</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Attachment</TableHead>
                  <TableHead>Extracted</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const reason = asString(row.mismatch_reason);
                  const conflict = reason?.startsWith("Conflict:") ?? false;
                  return (
                    <TableRow
                      key={getOrderKey(row)}
                      tabIndex={0}
                      onClick={() => setSelectedKey(getOrderKey(row))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedKey(getOrderKey(row));
                        }
                      }}
                      className="cursor-pointer align-top focus-visible:bg-muted/50 focus-visible:outline-none"
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatTimestamp(row.last_event_at)}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate">
                        {asString(row.last_email_from) ?? "-"}
                      </TableCell>
                      <TableCell className="max-w-[16rem] truncate">
                        {asString(row.last_email_subject) ?? "-"}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate">
                        {asString(row.attachment) ?? "-"}
                      </TableCell>
                      <TableCell>
                        <ExtractedChips order={row} />
                      </TableCell>
                      <TableCell className="max-w-[16rem]">
                        <div className="flex flex-col items-start gap-1">
                          {conflict ? (
                            <Badge className="border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300">
                              Conflict
                            </Badge>
                          ) : null}
                          <span className="text-sm break-words">
                            {reason ?? "-"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => navigate(query, safePage - 1)}
                disabled={safePage <= 1}
                aria-label="Previous page"
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => navigate(query, safePage + 1)}
                disabled={safePage >= totalPages}
                aria-label="Next page"
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </>
      )}

      <OrderDetail
        order={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedKey(null);
        }}
      />
    </div>
  );
}
