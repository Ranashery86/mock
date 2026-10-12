import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ErrorState } from "@/components/data-states";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MismatchTable,
  type MismatchRow,
} from "@/components/mismatch/mismatch-table";
import type { Order } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Mismatch",
};

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function sanitizeTerm(value: string): string {
  return value.replace(/[,()%*]/g, " ").trim();
}

async function MismatchSection({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(first(params.page), 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const query = first(params.q).trim();

  const supabase = await createClient();

  let request = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .eq("status", "mismatch");

  const term = sanitizeTerm(query);
  if (term) {
    const like = `%${term}%`;
    request = request.or(
      [
        `ci_number.ilike.${like}`,
        `pi_number.ilike.${like}`,
        `bl_number.ilike.${like}`,
        `last_email_from.ilike.${like}`,
        `last_email_subject.ilike.${like}`,
      ].join(",")
    );
  }

  request = request
    .order("last_event_at", { ascending: false, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, error, count } = await request;

  if (error) {
    return (
      <ErrorState
        title="Could not load mismatches"
        description="The mismatched emails could not be loaded."
      />
    );
  }

  const orders = (data ?? []) as Order[];
  const attachments = new Map<string, string | null>();

  const orderIds = orders
    .map((order) => order.id)
    .filter((id): id is string | number => id !== null && id !== undefined);

  if (orderIds.length > 0) {
    const { data: events } = await supabase
      .from("order_events")
      .select("order_id, attachment_name, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });

    for (const event of (events ?? []) as Array<{
      order_id?: string | number | null;
      attachment_name?: string | null;
    }>) {
      const key = String(event.order_id);
      if (!attachments.has(key)) {
        attachments.set(key, event.attachment_name ?? null);
      }
    }
  }

  const rows: MismatchRow[] = orders.map((order) => ({
    ...order,
    attachment: attachments.get(String(order.id)) ?? null,
  }));

  return (
    <MismatchTable
      rows={rows}
      total={count ?? 0}
      page={page}
      pageSize={PAGE_SIZE}
      query={query}
    />
  );
}

function MismatchFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-full max-w-sm" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function MismatchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Mismatch</h1>
        <p className="text-sm text-muted-foreground">
          Emails that could not be matched to an order yet.
        </p>
      </div>
      <Suspense fallback={<MismatchFallback />}>
        <MismatchSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
