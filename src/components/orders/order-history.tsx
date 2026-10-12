"use client";

import { useEffect, useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EmptyState, ErrorState } from "@/components/data-states";
import {
  asString,
  formatTimestamp,
  type OrderEvent,
} from "@/lib/orders";

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  created_mismatch: "Created (mismatch)",
  updated: "Updated",
  promoted: "Promoted",
  no_change: "No change",
  conflict_mismatch: "Conflict mismatch",
  merged: "Merged",
  duplicate_skipped: "Duplicate skipped",
  rejected_no_invoice: "Rejected (no invoice)",
};

const ACTION_STYLES: Record<string, string> = {
  created:
    "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  created_mismatch:
    "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  updated: "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300",
  promoted:
    "border-purple-500/30 bg-purple-500/15 text-purple-700 dark:text-purple-300",
  no_change: "border-border bg-muted text-muted-foreground",
  conflict_mismatch:
    "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300",
  merged: "border-border bg-muted text-muted-foreground",
};

function actionLabel(action: string | null): string {
  const raw = asString(action);
  if (!raw) return "Event";
  return (
    ACTION_LABELS[raw] ?? raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function JsonViewer({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;

  return (
    <Collapsible className="rounded-md border">
      <CollapsibleTrigger className="group flex w-full items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronRightIcon className="size-3 transition-transform group-data-[panel-open]:rotate-90" />
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="max-h-64 overflow-auto border-t bg-muted p-2 text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

function EventItem({ event }: { event: OrderEvent }) {
  const action = asString(event.action) ?? "";
  const source = asString(event.source);
  const changedFields = Array.isArray(event.changed_fields)
    ? event.changed_fields.filter((field) => asString(field))
    : [];

  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(event.event_at ?? event.created_at)}
        </span>
        {source ? (
          <Badge variant="outline" className="capitalize">
            {source}
          </Badge>
        ) : null}
        <Badge className={ACTION_STYLES[action] ?? ""} variant="outline">
          {actionLabel(action)}
        </Badge>
      </div>

      {action === "merged" ? (
        <p className="text-sm text-muted-foreground">
          Another record was merged into this order
          {asString(
            (event.meta as Record<string, unknown> | null)?.merged_from
          )
            ? ` (merged from ${String(
                (event.meta as Record<string, unknown>).merged_from
              )})`
            : "."}
        </p>
      ) : null}

      {changedFields.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-muted-foreground">Changed:</span>
          {changedFields.map((field) => (
            <Badge key={field} variant="secondary">
              {field}
            </Badge>
          ))}
        </div>
      ) : null}

      {event.email_subject || event.email_from ? (
        <div className="flex flex-col gap-0.5 text-xs">
          {event.email_subject ? (
            <span className="break-words">
              <span className="text-muted-foreground">Subject: </span>
              {event.email_subject}
            </span>
          ) : null}
          {event.email_from ? (
            <span className="break-words">
              <span className="text-muted-foreground">From: </span>
              {event.email_from}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {event.attachment_name ? (
          <span className="break-words">
            <span className="text-muted-foreground">Attachment: </span>
            {event.attachment_name}
          </span>
        ) : null}
        {event.extraction_method ? (
          <span>
            <span className="text-muted-foreground">Extraction: </span>
            {event.extraction_method}
          </span>
        ) : null}
      </div>

      <JsonViewer label="Raw payload" value={event.payload} />
      <JsonViewer label="Meta" value={event.meta} />
    </li>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg border p-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      ))}
    </div>
  );
}

export function OrderHistory({
  orderId,
  realtime = true,
}: {
  orderId: string | number;
  realtime?: boolean;
}) {
  const [supabase] = useState(() => createClient());
  const [events, setEvents] = useState<OrderEvent[] | null>(null);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: fetchError } = await supabase
        .from("order_events")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(true);
        return;
      }
      setError(false);
      setEvents((data ?? []) as OrderEvent[]);
    }

    void load();

    if (!realtime) return;

    const channel = supabase
      .channel(`order-events-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_events",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [supabase, orderId, realtime, reloadToken]);

  if (error) {
    return (
      <ErrorState
        title="Could not load history"
        description="The event history could not be loaded."
        onRetry={() => setReloadToken((token) => token + 1)}
      />
    );
  }

  if (events === null) {
    return <HistorySkeleton />;
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        description="Events for this record will appear here."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {events.map((event, index) => (
        <EventItem key={String(event.id ?? index)} event={event} />
      ))}
    </ol>
  );
}
