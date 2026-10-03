import { ImageIcon } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { saveCompanyLogo } from "./actions";

export function BrandPanel({ name, logoDataUrl, canEdit }: { name: string; logoDataUrl: string | null; canEdit: boolean }) {
  const logo = logoDataUrl && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(logoDataUrl) ? logoDataUrl : null;
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[var(--shadow-atlas)]">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white px-6 py-10">
          {logo ? <img src={logo} alt="" className="size-24 object-contain" /> : <span className="flex size-24 items-center justify-center rounded-2xl bg-slate-50 text-slate-400"><ImageIcon size={28} /></span>}
          <p className="mt-4 max-w-full truncate text-sm font-semibold text-slate-900">{name}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">Company mark</p>
        </div>
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">Make Atlas look like your company</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">Your logo appears in the sidebar and on the workspace home for everyone in this company. Use a square PNG, JPG, WEBP or GIF under 180 KB.</p>
          {canEdit ? (
            <ActionForm action={saveCompanyLogo} className="mt-6 flex flex-wrap items-center gap-3">
              <input name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="max-w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-indigo-700" />
              {logo && <label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" name="remove" /> Remove current logo</label>}
              <button className="rounded-full bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white">Save logo</button>
            </ActionForm>
          ) : <p className="mt-6 text-sm text-slate-500">Your administrator can change the company logo.</p>}
        </div>
      </div>
    </section>
  );
}
