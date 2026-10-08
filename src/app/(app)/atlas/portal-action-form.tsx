"use client";
import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/ui/action-form";

export function PortalActionForm({ action, children, label = "Save", successPath }: { action: (form: FormData) => Promise<void>; children: React.ReactNode; label?: string; successPath?: string }) {
  const router = useRouter();
  const submit = async (form: FormData) => {
    await action(form);
    if (successPath) router.replace(successPath);
  };
  return <ActionForm action={submit} label={label} className="space-y-4">{children}</ActionForm>;
}
