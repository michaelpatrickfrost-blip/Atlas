"use client";
import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { completePasswordRecovery } from "@/core/auth/security-actions";

const input = "mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm";

export function ResetForm({companySlug,portal}:{companySlug?:string;portal?:"atlas"}={}) {
  const router = useRouter();
  // Saving opens the person's company. An older data service only saves the password, so fall back to sign-in.
  async function save(form: FormData) {
    await completePasswordRecovery(form);
    router.push(companySlug ? `/business/${companySlug}/login` : portal === "atlas" ? "/atlas/login" : "/login");
  }
  return (
    <ActionForm action={save} className="rounded-2xl border border-black/[0.06] bg-white p-5">
      {companySlug && <input type="hidden" name="companySlug" value={companySlug}/>}
      {portal && <input type="hidden" name="portal" value={portal}/>}
      <div className="space-y-4 pb-2">
      <label className="block text-[13px] text-[#6e6e73]">Code<input name="code" required autoComplete="off" maxLength={64} className={`${input} font-mono text-xs`} /></label>
      <label className="block text-[13px] text-[#6e6e73]">New password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={input} /></label>
      <label className="block text-[13px] text-[#6e6e73]">Confirm password<input name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={input} /></label>
      <p className="text-xs text-[#86868b]">At least 12 characters.</p>
      <button className="w-full rounded-full bg-[#0071e3] px-4 py-2.5 text-sm font-medium text-white">Save password</button>
      </div>
    </ActionForm>
  );
}
