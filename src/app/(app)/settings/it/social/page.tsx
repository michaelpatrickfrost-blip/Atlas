import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { SOCIAL_PLATFORMS } from "@/core/email/presets";
import { SocialForm } from "./social-form";
import { checkSocialAccount, deleteSocialAccount } from "../actions";

const btn = "rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50";

export default async function SocialAccounts() {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.itManage);
  const accounts = await db.socialAccount.findMany({ where: { organisationId: session.organisationId }, orderBy: { createdAt: "asc" }, select: { id: true, platform: true, label: true, status: true, lastError: true } });
  return (
    <div className="max-w-4xl space-y-8">
      <div><h2 className="text-2xl font-semibold tracking-tight">Social accounts</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">Connect the accounts Marketing may publish to. Credentials are stored encrypted. Platforms without a free publishing API are prepared in Atlas and opened for you to post.</p></div>
      <div className="space-y-3">
        {accounts.map((a) => {
          const p = SOCIAL_PLATFORMS.find((x) => x.key === a.platform);
          return (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
              <div><p className="font-semibold">{a.label}</p><p className="text-sm text-slate-500">{p?.label ?? a.platform} · {p?.api ? (a.status === "OK" ? "Connected" : a.status === "ERROR" ? "Problem" : "Not tested") : "Copy and open"}</p>{a.lastError && <p className="text-xs text-red-700">{a.lastError}</p>}</div>
              <div className="flex gap-2">
                {p?.api && <ActionForm action={checkSocialAccount}><input type="hidden" name="id" value={a.id} /><button className={btn}>Test connection</button></ActionForm>}
                <ActionForm action={deleteSocialAccount}><input type="hidden" name="id" value={a.id} /><button className={`${btn} text-red-700`}>Remove</button></ActionForm>
              </div>
            </div>
          );
        })}
        {!accounts.length && <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No social accounts yet.</p>}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 text-base font-semibold">Add an account</h3><SocialForm /></section>
    </div>
  );
}
