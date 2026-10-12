import { formatTimestamp, parseRemarks, type Order } from "@/lib/orders";

export function OrderRemarks({ order }: { order: Order }) {
  const entries = parseRemarks(order.remarks);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">-</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry, index) => (
        <li key={`${index}-${entry.raw}`} className="flex gap-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
          <div className="flex flex-col gap-0.5">
            {entry.timestamp ? (
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(entry.timestamp)}
              </span>
            ) : null}
            <span className="text-sm break-words">{entry.text || "-"}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
