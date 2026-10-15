export type OrderStatus = "order" | "mismatch";

export type EventSource = "form" | "email" | "system";

export type EventAction =
  | "created"
  | "created_mismatch"
  | "updated"
  | "promoted"
  | "no_change"
  | "conflict_mismatch"
  | "merged"
  | "duplicate_skipped"
  | "rejected_no_invoice";

export type Order = {
  id?: string | number | null;
  ci_number?: string | null;
  sales_man?: string | null;
  product_name?: string | null;
  quantity?: string | null;
  description?: string | null;
  order_keys?: string[] | null;
  status?: string | null;
  mismatch_reason?: string | null;
  promoted_at?: string | null;
  created_by_source?: string | null;
  last_source?: string | null;
  last_event_at?: string | null;
  last_email_from?: string | null;
  last_email_subject?: string | null;
  last_email_id?: string | null;
  last_extraction_method?: string | null;
  remarks?: string | null;
  remarks_received_at?: string | null;
  extra?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
} & Record<string, unknown>;

export type OrderEvent = {
  id?: string | number | null;
  order_id?: string | number | null;
  source?: string | null;
  action?: string | null;
  changed_fields?: string[] | null;
  event_at?: string | null;
  email_from?: string | null;
  email_to?: string | null;
  email_subject?: string | null;
  attachment_name?: string | null;
  extraction_method?: string | null;
  meta?: unknown;
  payload?: unknown;
  created_at?: string | null;
} & Record<string, unknown>;
