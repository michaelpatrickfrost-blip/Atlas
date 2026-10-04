"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DocumentComposer({
  data,
  mode,
  initialCustomer = "",
  initialOpportunity = "",
  initialProject = "",
  initialKind = "STANDARD",
  initialOrderType = "STANDARD",
  initialAgreement = "",
  draft,
  workingDraftId,
}: {
  data: any;
  mode: "quote" | "order";
  initialCustomer?: string;
  initialOpportunity?: string;
  initialProject?: string;
  initialKind?: "STANDARD" | "BLANKET";
  initialOrderType?: "STANDARD" | "PROJECT" | "CALL_OFF";
  initialAgreement?: string;
  draft?: any;
  workingDraftId?: string;
}) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href={`/sales/${mode === "quote" ? "quotes" : "orders"}`}
          className="text-xs text-gray-500"
        >
          {mode === "quote" ? "Quotations" : "Sales orders"} / {draft?.reference ?? "New"}
        </Link>
        <h2 className="mt-2 text-3xl font-semibold">
          {draft?.reference ?? (mode === "quote" ? "New quotation" : "New sales order")}
        </h2>
      </div>
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600">
          Document composer is being rebuilt. The previous version had formatting issues that are being resolved.
        </p>
      </div>
      <Link href={`/sales/${mode === "quote" ? "quotes" : "orders"}`}>
        <Button variant="secondary">Back</Button>
      </Link>
    </div>
  );
}
