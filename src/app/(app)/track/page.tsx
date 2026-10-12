import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackView } from "@/components/track/track-view";
import { normalizeType } from "@/lib/track";

export const metadata: Metadata = {
  title: "Track",
};

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function TrackSection({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const type = normalizeType(first(params.type));
  const query = first(params.q).trim();
  return (
    <TrackView
      key={`${type}:${query}`}
      initialType={type}
      initialQuery={query}
    />
  );
}

function TrackFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-full max-w-sm" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

export default function TrackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Track</h1>
        <p className="text-sm text-muted-foreground">
          Look up a shipment by its CI, PI or BL number.
        </p>
      </div>
      <Suspense fallback={<TrackFallback />}>
        <TrackSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
