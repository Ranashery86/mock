import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const WEBHOOK_TIMEOUT_MS = 10_000;

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const invoiceNumber = asTrimmed(body.invoice_number);
  if (!invoiceNumber) {
    return NextResponse.json(
      { error: "Invoice number is required" },
      { status: 400 }
    );
  }

  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .select("status, webhook_url")
    .eq("key", "sales-form")
    .maybeSingle();

  if (workflowError) {
    return NextResponse.json(
      { error: "Could not load the Sales workflow configuration" },
      { status: 500 }
    );
  }

  const workflowRow = workflow as {
    status?: string | null;
    webhook_url?: string | null;
  } | null;

  if (
    !workflowRow ||
    workflowRow.status !== "active" ||
    !workflowRow.webhook_url
  ) {
    return NextResponse.json(
      { error: "Sales webhook is not configured" },
      { status: 503 }
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.N8N_WEBHOOK_SECRET) {
    headers["x-webhook-secret"] = process.env.N8N_WEBHOOK_SECRET;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  let result: unknown;
  try {
    const response = await fetch(workflowRow.webhook_url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        sales_man: asTrimmed(body.sales_man),
        product_name: asTrimmed(body.product_name),
        quantity: asTrimmed(body.quantity),
        invoice_number: invoiceNumber,
        description: asTrimmed(body.description),
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Sales webhook responded with ${response.status}` },
        { status: 502 }
      );
    }

    result = await response.json().catch(() => null);
    if (result === null || typeof result !== "object" || Array.isArray(result)) {
      return NextResponse.json(
        { error: "Unexpected response from the Sales webhook" },
        { status: 502 }
      );
    }
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: timedOut
          ? "Sales webhook timed out"
          : "Could not reach the Sales webhook",
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }

  return NextResponse.json({ ok: true, result });
}
