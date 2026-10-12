import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { OrdersTable } from "@/components/orders/orders-table";
import { ErrorState } from "@/components/data-states";
import type { Order } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Overview",
};

async function OrdersSection() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "order")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <ErrorState
        title="Could not load orders"
        description="The orders could not be loaded. Please refresh the page."
      />
    );
  }

  return <OrdersTable initialOrders={(data ?? []) as Order[]} />;
}

function OrdersFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-8 w-full max-w-sm animate-pulse rounded-lg bg-muted" />
      <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          All workflow output in one place.
        </p>
      </div>
      <Suspense fallback={<OrdersFallback />}>
        <OrdersSection />
      </Suspense>
    </div>
  );
}
