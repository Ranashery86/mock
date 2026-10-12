import {
  STAGES,
  getStageColumns,
  type StageDefinition,
} from "@/lib/stages";
import type { Order, OrderEvent } from "@/lib/types";

export type { Order, OrderEvent };

export type StageState = {
  number: string | null;
  date: string | null;
  receivedAt: string | null;
  done: boolean;
};

export function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

export function getOrderKey(order: Order): string {
  const id = order.id;
  if (id !== null && id !== undefined && String(id).length > 0) {
    return `id:${id}`;
  }
  return `ci:${asString(order.ci_number) ?? ""}`;
}

export function getStage(order: Order, stage: StageDefinition): StageState {
  const columns = getStageColumns(stage);
  const number = columns.number ? asString(order[columns.number]) : null;
  const date = asString(order[columns.date]);
  const receivedAt = asString(order[columns.receivedAt]);

  return {
    number,
    date,
    receivedAt,
    done: stage.hasNumber ? number !== null || date !== null : date !== null,
  };
}

export type StageWithState = {
  stage: StageDefinition;
  state: StageState;
};

export function getStages(order: Order): StageWithState[] {
  return STAGES.map((stage) => ({ stage, state: getStage(order, stage) }));
}

export function getCurrentStage(order: Order): StageDefinition | null {
  let current: StageDefinition | null = null;
  for (const stage of STAGES) {
    if (getStage(order, stage).done) {
      current = stage;
    }
  }
  return current;
}

export function getStageProgress(order: Order): {
  done: number;
  total: number;
  current: StageDefinition | null;
} {
  const done = STAGES.filter((stage) => getStage(order, stage).done).length;
  return { done, total: STAGES.length, current: getCurrentStage(order) };
}

const KARACHI_TIMESTAMP = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Karachi",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const KARACHI_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatTimestamp(value: unknown): string {
  const raw = asString(value);
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return KARACHI_TIMESTAMP.format(date);
}

export function formatDate(value: unknown): string {
  return asString(value) ?? "-";
}

export function formatText(value: unknown): string {
  return asString(value) ?? "-";
}

export function formatSource(value: unknown): string {
  const raw = asString(value);
  if (!raw) return "-";
  if (raw === "form") return "Form";
  if (raw === "email") return "Email";
  if (raw === "system") return "System";
  return raw;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function dayNumber(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function parsePlainDate(
  value: unknown
): { year: number; month: number; day: number } | null {
  const raw = asString(value);
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return {
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
    };
  }

  const named = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{4})/);
  if (named) {
    const month = MONTHS[named[2].slice(0, 3).toLowerCase()];
    if (month) {
      return {
        year: Number(named[3]),
        month,
        day: Number(named[1]),
      };
    }
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) {
    return {
      year: Number(slash[3]),
      month: Number(slash[2]),
      day: Number(slash[1]),
    };
  }

  return null;
}

function todayInKarachi(): number {
  const parts = KARACHI_DATE.formatToParts(new Date());
  const values: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  return dayNumber(values.year, values.month, values.day);
}

export function getEtaInfo(value: unknown): string {
  const parsed = parsePlainDate(value);
  if (!parsed) return "ETA not received yet";

  const target = dayNumber(parsed.year, parsed.month, parsed.day);
  const diff = target - todayInKarachi();

  if (diff === 0) return "Arrives today";
  if (diff > 0) return `${diff} day${diff === 1 ? "" : "s"} left`;
  const past = -diff;
  return `ETA passed ${past} day${past === 1 ? "" : "s"} ago`;
}

export function normalizeNumber(value: string): string {
  return value.toUpperCase().replace(/[\s/._-]/g, "");
}

export function buildOrderKey(type: string, value: string): string {
  return `${type.toLowerCase()}:${normalizeNumber(value)}`;
}

export type RemarkEntry = {
  raw: string;
  timestamp: string | null;
  text: string;
};

export function parseRemarks(value: unknown): RemarkEntry[] {
  const raw = asString(value);
  if (!raw) return [];

  const entries = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = line.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
      if (match) {
        return {
          raw: line,
          timestamp: match[1].trim(),
          text: match[2].trim(),
        };
      }
      return { raw: line, timestamp: null, text: line };
    });

  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const aTime = a.entry.timestamp
        ? new Date(a.entry.timestamp).getTime()
        : Number.NaN;
      const bTime = b.entry.timestamp
        ? new Date(b.entry.timestamp).getTime()
        : Number.NaN;
      const aValid = !Number.isNaN(aTime);
      const bValid = !Number.isNaN(bTime);
      if (aValid && bValid && aTime !== bTime) return bTime - aTime;
      if (aValid !== bValid) return aValid ? -1 : 1;
      return b.index - a.index;
    })
    .map(({ entry }) => entry);
}
