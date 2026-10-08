"use client";
import { ActionForm } from "@/components/ui/action-form";

export function PortalActionForm({ action, children, label = "Save" }: { action: (form: FormData) => Promise<void>; children: React.ReactNode; label?: string }) {
  return <ActionForm action={action} label={label} className="space-y-4">{children}</ActionForm>;
}
