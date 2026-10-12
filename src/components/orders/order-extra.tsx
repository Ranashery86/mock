import type { Order } from "@/lib/orders";

function isEmpty(extra: unknown): boolean {
  if (extra === null || extra === undefined) return true;
  if (typeof extra === "object" && !Array.isArray(extra)) {
    return Object.keys(extra as Record<string, unknown>).length === 0;
  }
  return false;
}

export function OrderExtraFields({ order }: { order: Order }) {
  const extra = order.extra;
  if (isEmpty(extra)) return null;

  if (typeof extra !== "object" || Array.isArray(extra)) {
    return (
      <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
        {JSON.stringify(extra, null, 2)}
      </pre>
    );
  }

  const entries = Object.entries(extra as Record<string, unknown>);

  return (
    <dl className="flex flex-col gap-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{key}</dt>
          <dd className="break-words">
            {value === null || value === undefined || value === "" ? (
              <span className="text-muted-foreground">-</span>
            ) : typeof value === "object" ? (
              <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              String(value)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function hasExtra(extra: unknown): boolean {
  return !isEmpty(extra);
}
