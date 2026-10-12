import type { Metadata } from "next";
import { SalesForm } from "./sales-form";

export const metadata: Metadata = {
  title: "Sales",
};

export default function SalesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Sales</h1>
        <p className="text-sm text-muted-foreground">
          Create an order and send it to the Sales workflow.
        </p>
      </div>
      <SalesForm />
    </div>
  );
}
