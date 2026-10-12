"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PackageSearchIcon, SearchIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState } from "@/components/data-states";
import { OrderStageTimeline } from "@/components/orders/order-timeline";
import { OrderRemarks } from "@/components/orders/order-remarks";
import { OrderHistory } from "@/components/orders/order-history";
import {
  asString,
  buildOrderKey,
  formatText,
  getEtaInfo,
  getStageProgress,
  type Order,
} from "@/lib/orders";
import { TRACK_TYPE_ITEMS, type TrackType } from "@/lib/track";

const TYPE_ITEMS = TRACK_TYPE_ITEMS;

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium break-words">{value}</span>
    </div>
  );
}

export function TrackView({
  initialType,
  initialQuery,
}: {
  initialType: TrackType;
  initialQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());

  const [type, setType] = useState<TrackType>(initialType);
  const [input, setInput] = useState(initialQuery);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    initialQuery.trim() ? "loading" : "idle"
  );
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const query = initialQuery.trim();
    if (!query) return;

    let cancelled = false;

    async function run() {
      const key = buildOrderKey(initialType, query);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .contains("order_keys", [key]);

      if (cancelled) return;

      if (error) {
        setStatus("error");
        return;
      }

      const rows = (data ?? []) as Order[];
      const match =
        rows.find((row) => row.status === "order") ?? rows[0] ?? null;
      setOrder(match);
      setStatus("done");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase, initialType, initialQuery]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("type", type);
    if (input.trim()) params.set("q", input.trim());
    router.push(`${pathname}?${params.toString()}`);
  }

  const progress = order ? getStageProgress(order) : null;

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-2"
      >
        <Select
          value={type}
          onValueChange={(value) => {
            if (value) setType(value as TrackType);
          }}
          items={TYPE_ITEMS}
        >
          <SelectTrigger className="w-24" aria-label="Number type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ci">CI</SelectItem>
            <SelectItem value="pi">PI</SelectItem>
            <SelectItem value="bl">BL</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. BL777"
          className="w-full max-w-xs"
          aria-label="Number to track"
        />
        <Button type="submit">
          <SearchIcon />
          Search
        </Button>
      </form>

      {status === "idle" ? (
        <EmptyState
          icon={PackageSearchIcon}
          title="Track a shipment"
          description="Choose a number type, enter the number and press Search."
        />
      ) : status === "loading" ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : status === "error" ? (
        <ErrorState
          title="Could not run the search"
          description="Something went wrong while looking up this number."
        />
      ) : !order ? (
        <EmptyState
          icon={PackageSearchIcon}
          title="No order or email found for this number."
          description="Check the number and try again."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {order.status === "mismatch" ? (
            <div className="flex flex-col gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <p className="font-medium">
                This number was found in an email but is not matched to an
                order yet
              </p>
              {asString(order.mismatch_reason) ? (
                <p className="text-muted-foreground">
                  {order.mismatch_reason}
                </p>
              ) : null}
              <Link
                href="/mismatch"
                className="w-fit text-primary underline-offset-4 hover:underline"
              >
                View mismatched emails
              </Link>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">
                {asString(order.ci_number) ?? "Invoice missing"}
              </h2>
              {progress?.current ? (
                <Badge variant="secondary">{progress.current.label}</Badge>
              ) : (
                <Badge variant="outline">Not started</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DetailField
                label="Product"
                value={formatText(order.product_name)}
              />
              <DetailField
                label="Sales man"
                value={formatText(order.sales_man)}
              />
              <DetailField
                label="Quantity"
                value={formatText(order.quantity)}
              />
              <DetailField
                label="ETA"
                value={getEtaInfo(order.eta_date)}
              />
            </div>
            {progress ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {progress.done} of {progress.total} stages
                  </span>
                  <span>{getEtaInfo(order.eta_date)}</span>
                </div>
                <Progress value={progress.done} max={progress.total} />
              </div>
            ) : null}
          </div>

          <section className="flex flex-col gap-3 rounded-xl border p-4">
            <h3 className="text-sm font-medium">Stages</h3>
            <OrderStageTimeline order={order} />
          </section>

          <section className="flex flex-col gap-3 rounded-xl border p-4">
            <h3 className="text-sm font-medium">Remarks</h3>
            <OrderRemarks order={order} />
          </section>

          <section className="flex flex-col gap-3 rounded-xl border p-4">
            <h3 className="text-sm font-medium">History</h3>
            {order.id !== null && order.id !== undefined ? (
              <OrderHistory
                key={String(order.id)}
                orderId={order.id}
                realtime={false}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No history available.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
