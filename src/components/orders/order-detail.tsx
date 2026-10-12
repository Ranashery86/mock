"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderStageTimeline } from "@/components/orders/order-timeline";
import { OrderRemarks } from "@/components/orders/order-remarks";
import { OrderExtraFields, hasExtra } from "@/components/orders/order-extra";
import { OrderHistory } from "@/components/orders/order-history";
import { asString, formatText, type Order } from "@/lib/orders";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="break-words">{value}</span>
    </div>
  );
}

function StatusBadge({ order }: { order: Order }) {
  if (order.status === "mismatch") {
    return (
      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300">
        Mismatch
      </Badge>
    );
  }
  return (
    <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
      Order
    </Badge>
  );
}

export function OrderDetail({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
      >
        {order ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <SheetTitle>
                  {asString(order.ci_number) ?? "Invoice missing"}
                </SheetTitle>
                <StatusBadge order={order} />
              </div>
              <SheetDescription>
                {asString(order.product_name) ?? "No product"}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 p-4 pt-0">
              {asString(order.mismatch_reason) ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {order.mismatch_reason}
                </div>
              ) : null}

              <section className="flex flex-col gap-3 rounded-lg border p-3">
                <h3 className="text-sm font-medium">Sales info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Sales man"
                    value={formatText(order.sales_man)}
                  />
                  <Field
                    label="Product"
                    value={formatText(order.product_name)}
                  />
                  <Field
                    label="Quantity"
                    value={formatText(order.quantity)}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">
                    Description
                  </span>
                  <span className="break-words">
                    {formatText(order.description)}
                  </span>
                </div>
              </section>

              <Separator />

              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Stages</h3>
                <OrderStageTimeline order={order} />
              </section>

              <Separator />

              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Remarks</h3>
                <OrderRemarks order={order} />
              </section>

              {hasExtra(order.extra) ? (
                <>
                  <Separator />
                  <section className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium">Extra</h3>
                    <OrderExtraFields order={order} />
                  </section>
                </>
              ) : null}

              <Separator />

              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">History</h3>
                {order.id !== null && order.id !== undefined ? (
                  <OrderHistory key={String(order.id)} orderId={order.id} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No history available.
                  </p>
                )}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
