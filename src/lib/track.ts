export type TrackType = "ci" | "pi" | "bl";

export const TRACK_TYPE_ITEMS: Record<TrackType, string> = {
  ci: "CI",
  pi: "PI",
  bl: "BL",
};

export function normalizeType(value: string | null | undefined): TrackType {
  if (value === "pi" || value === "bl" || value === "ci") return value;
  return "ci";
}
