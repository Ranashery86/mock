"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
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
import { EmptyState, ErrorState } from "@/components/data-states";
import {
  asString,
  formatDate,
  formatSource,
  formatText,
  formatTimestamp,
  getCurrentStage,
  getOrderKey,
  type Order,
} from "@/lib/orders";

const PAGE_SIZE = 10;

export function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [supabase] = useState(() => createClient());
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "order")
      .order("updated_at", { ascending: false });
    if (error) {
      setRefreshError(true);
      return;
    }
    setRefreshError(false);
    if (data) {
      setOrders(data as Order[]);
    }
  }, [supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("orders-overview")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, refresh]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((order) =>
      [
        order.ci_number,
        order.sales_man,
        order.product_name,
        order.quantity,
        order.description,
      ].some(
        (value) =>
          typeof value === "string" && value.toLowerCase().includes(needle)
      )
    );
  }, [orders, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageOrders = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const selected = useMemo(
    () => orders.find((order) => getOrderKey(order) === selectedKey) ?? null,
    [orders, selectedKey]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search invoice, sales man, product..."
            className="pl-8"
            aria-label="Search orders"
          />
        </div>
        <span className="ml-auto hidden text-sm text-muted-foreground sm:block">
          {filtered.length} order{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {refreshError ? (
        <ErrorState
          title="Could not refresh orders"
          description="Live updates are unavailable right now."
          onRetry={() => void refresh()}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="No orders yet"
          description="Orders will appear here once the workflow creates them."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching orders"
          description="Try a different search term."
        />
      ) : (
        <>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Sales man</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Current stage</TableHead>
                  <TableHead>ETD</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageOrders.map((order) => {
                  const stage = getCurrentStage(order);
                  const invoice = asString(order.ci_number);
                  return (
                    <TableRow
                      key={getOrderKey(order)}
                      tabIndex={0}
                      onClick={() => setSelectedKey(getOrderKey(order))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedKey(getOrderKey(order));
                        }
                      }}
                      className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none"
                    >
                      <TableCell className="font-medium">
                        {invoice ? (
                          invoice
                        ) : (
                          <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            Invoice missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatText(order.sales_man)}</TableCell>
                      <TableCell>{formatText(order.product_name)}</TableCell>
                      <TableCell>{formatText(order.quantity)}</TableCell>
                      <TableCell>
                        {stage ? (
                          <Badge variant="secondary">{stage.label}</Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            Not started
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(order.etd_date)}</TableCell>
                      <TableCell>{formatDate(order.eta_date)}</TableCell>
                      <TableCell>{formatTimestamp(order.updated_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatSource(order.last_source)}
                        </Badge>
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
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
                aria-label="Previous page"
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
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
