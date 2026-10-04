import { ActionForm } from "@/components/ui/action-form";
import { hashtagLabel } from "@/core/shared/hashtags";
import { HashtagEditor } from "./hashtags";
import { SalesPointerPanel } from "./sales-pointer-panel";

export function OrderRecovery({
  tags,
  version,
  customerPo,
  showCustomerPo,
  canEditTags,
  canUndo,
  canReturn,
  saveHashtags,
  undoCancellation,
  returnToQuote,
}: {
  tags: string[];
  version: string;
  customerPo: string | null;
  showCustomerPo: boolean;
  canEditTags: boolean;
  canUndo: boolean;
  canReturn: boolean;
  saveHashtags: (form: FormData) => Promise<void>;
  undoCancellation: (form: FormData) => Promise<void>;
  returnToQuote: (form: FormData) => Promise<void>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Hashtags</h2>
        {showCustomerPo && (
          <p className="mt-2 text-sm text-slate-600">
            Customer purchase order: {customerPo || "not set"}. That number is separate from hashtags.
          </p>
        )}
        {canEditTags ? (
          <ActionForm action={saveHashtags} className="mt-4 space-y-3">
            <input type="hidden" name="version" value={version} />
            <HashtagEditor initial={tags} />
            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white">Save hashtags</button>
          </ActionForm>
        ) : (
          <p className="mt-3 text-sm text-slate-600">{tags.length ? tags.map(hashtagLabel).join(" ") : "No hashtags"}</p>
        )}
      </section>
      <section className="space-y-4">
        <SalesPointerPanel surface="sale" />
        {(canUndo || canReturn) && (
          <div className="flex flex-wrap gap-2">
            {canUndo && (
              <ActionForm action={undoCancellation}>
                <button type="submit" className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Undo cancellation</button>
              </ActionForm>
            )}
            {canReturn && (
              <ActionForm action={returnToQuote}>
                <button type="submit" className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Turn back into a quotation</button>
              </ActionForm>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
