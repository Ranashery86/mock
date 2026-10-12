import { Badge } from "@/components/ui/badge";
import { formatDate, formatTimestamp, getStages, type Order } from "@/lib/orders";
import { cn } from "@/lib/utils";

export function OrderStageTimeline({ order }: { order: Order }) {
  const stages = getStages(order);

  return (
    <ol className="flex flex-col">
      {stages.map(({ stage, state }, index) => (
        <li key={stage.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "mt-1.5 size-2.5 shrink-0 rounded-full",
                state.done ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
            {index < stages.length - 1 ? (
              <span
                className={cn(
                  "w-px flex-1",
                  state.done ? "bg-primary/40" : "bg-border"
                )}
              />
            ) : null}
          </div>
          <div
            className={cn(
              "mb-3 flex-1 rounded-lg border p-3",
              state.done ? "" : "border-dashed opacity-70"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{stage.label}</span>
              {state.done ? (
                <Badge variant="secondary">Done</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Not received yet
                </span>
              )}
            </div>
            {state.done ? (
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-3">
                {stage.hasNumber ? (
                  <span className="text-muted-foreground">
                    Number:{" "}
                    <span className="text-foreground">
                      {state.number ?? "-"}
                    </span>
                  </span>
                ) : null}
                <span className="text-muted-foreground">
                  Date:{" "}
                  <span className="text-foreground">
                    {formatDate(state.date)}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Received:{" "}
                  <span className="text-foreground">
                    {formatTimestamp(state.receivedAt)}
                  </span>
                </span>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
