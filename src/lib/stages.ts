export const STAGE_KEYS = [
  "pr",
  "po",
  "pi",
  "ci",
  "lc",
  "etd",
  "bl",
  "eta",
  "igm",
  "gd",
  "clr",
  "grn",
] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

export type StageDefinition = {
  key: StageKey;
  label: string;
  hasNumber: boolean;
};

export const STAGES: StageDefinition[] = [
  { key: "pr", label: "Purchase Requisition", hasNumber: true },
  { key: "po", label: "Purchase Order", hasNumber: true },
  { key: "pi", label: "Proforma Invoice", hasNumber: true },
  { key: "ci", label: "Commercial Invoice", hasNumber: true },
  { key: "lc", label: "Letter of Credit", hasNumber: true },
  { key: "etd", label: "Departure", hasNumber: false },
  { key: "bl", label: "Bill of Lading", hasNumber: true },
  { key: "eta", label: "Arrival", hasNumber: false },
  { key: "igm", label: "Import General Manifest", hasNumber: true },
  { key: "gd", label: "Goods Declaration", hasNumber: true },
  { key: "clr", label: "Customs Clearance", hasNumber: true },
  { key: "grn", label: "Goods Receipt Note", hasNumber: true },
];

export function stageAbbr(stage: StageDefinition): string {
  return stage.key.toUpperCase();
}

export type StageColumns = {
  number: string | null;
  date: string;
  receivedAt: string;
};

export function getStageColumns(stage: StageDefinition): StageColumns {
  return {
    number: stage.hasNumber ? `${stage.key}_number` : null,
    date: `${stage.key}_date`,
    receivedAt: `${stage.key}_received_at`,
  };
}
