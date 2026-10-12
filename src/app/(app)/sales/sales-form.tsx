"use client";

import { useState } from "react";
import {
  CircleCheckIcon,
  LoaderCircleIcon,
  SendIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const EMPTY_FORM = {
  sales_man: "",
  product_name: "",
  quantity: "",
  invoice_number: "",
  description: "",
};

type FormState = typeof EMPTY_FORM;

type SalesResult = {
  action?: string | null;
  reason?: string | null;
};

type ApiResponse = {
  ok?: boolean;
  result?: SalesResult | null;
  error?: string;
};

type Message = {
  variant: "success" | "error";
  text: string;
} | null;

const CLEAR_ACTIONS = new Set([
  "created",
  "promoted",
  "updated",
  "no_change",
]);

function messageForAction(action: string | null | undefined): Message | null {
  switch (action) {
    case "created":
      return { variant: "success", text: "Order created" };
    case "promoted":
      return {
        variant: "success",
        text: "Order created. Earlier emails for this invoice were found and attached",
      };
    case "updated":
    case "no_change":
      return {
        variant: "success",
        text: "This invoice already existed. Sales info updated",
      };
    case "rejected_no_invoice":
      return { variant: "error", text: "Invoice number is required" };
    default:
      return null;
  }
}

export function SalesForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => null)) as
        | ApiResponse
        | null;

      if (!response.ok) {
        setMessage({
          variant: "error",
          text: payload?.error ?? "Something went wrong. Please try again.",
        });
        return;
      }

      const action = payload?.result?.action ?? null;
      const nextMessage = messageForAction(action);

      if (!nextMessage) {
        setMessage({
          variant: "error",
          text:
            payload?.result?.reason ??
            "Something went wrong. Please try again.",
        });
        return;
      }

      setMessage(nextMessage);
      if (action && CLEAR_ACTIONS.has(action)) {
        setForm(EMPTY_FORM);
      }
    } catch {
      setMessage({
        variant: "error",
        text: "Could not reach the server. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>New order</CardTitle>
        <CardDescription>
          The invoice number is required. Other fields are optional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sales_man">Sales Man</Label>
            <Input
              id="sales_man"
              value={form.sales_man}
              onChange={(event) => update("sales_man", event.target.value)}
              placeholder="e.g. Ahmed Khan"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product_name">Product Name</Label>
            <Input
              id="product_name"
              value={form.product_name}
              onChange={(event) => update("product_name", event.target.value)}
              placeholder="e.g. Stainless steel sheets"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              value={form.quantity}
              onChange={(event) => update("quantity", event.target.value)}
              placeholder="e.g. 500 kg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invoice_number">Invoice Number</Label>
            <Input
              id="invoice_number"
              value={form.invoice_number}
              onChange={(event) => update("invoice_number", event.target.value)}
              placeholder="Invoice / CI number"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Optional notes about this order"
              rows={3}
            />
          </div>

          {message ? (
            <div
              role={message.variant === "error" ? "alert" : "status"}
              className={
                message.variant === "error"
                  ? "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-sm text-destructive"
                  : "flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-sm text-emerald-700 dark:text-emerald-300"
              }
            >
              {message.variant === "error" ? (
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              ) : (
                <CircleCheckIcon className="mt-0.5 size-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <SendIcon />
              )}
              {isSubmitting ? "Submitting..." : "Submit order"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
