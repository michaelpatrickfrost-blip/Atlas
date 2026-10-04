"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CATEGORY_CLASSES, categoryLabel } from "@/core/products/categories";
import { addStandardCategories, retireCategory, saveCategory } from "@/app/(app)/products/actions";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";

export function CategoryDesk(props: {
  categories: Array<{ id: string; code: string; name: string; description: string; itemClass: string; parentId: string | null; active: boolean }>;
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [itemClass, setClass] = useState("OTHER");
  const [parentId, setParent] = useState("");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const current = props.categories.find((category) => category.id === editing);
  const begin = (id: string | null) => {
    const category = props.categories.find((item) => item.id === id);
    setEditing(id);
    setCode(category?.code ?? "");
    setName(category?.name ?? "");
    setDescription(category?.description ?? "");
    setClass(category?.itemClass ?? "FINISHED");
    setParent(category?.parentId ?? "");
    setMessage("");
  };
  const save = () => start(async () => {
    setMessage("");
    try {
      await saveCategory({ id: editing ?? undefined, code, name, description, itemClass, parentId });
      setFailed(false);
      setMessage("Category saved. Products and price rules use this code.");
      begin(null);
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Could not save the category.");
    }
  });
  const starters = () => start(async () => {
    setMessage("");
    try {
      const added = await addStandardCategories();
      setFailed(false);
      setMessage(added ? "Standard categories added. Rename them to match how you group the catalogue." : "Those categories are already in the catalogue.");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Could not add categories.");
    }
  });
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-sm font-semibold">Categories</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Group finished goods, materials, work in progress, packaging and services. A product keeps the category code, and price rules match that same code. Name the groups for your plant.</p></div>
      <div className="flex gap-2"><Button type="button" onClick={starters} disabled={pending}>Add standard groups</Button><Button type="button" onClick={() => begin(null)}>New category</Button></div>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {props.categories.map((category) => <li key={category.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div><p className="text-sm font-medium">{category.name}{category.active ? "" : " · retired"}</p><p className="mt-1 text-xs text-slate-500">{category.code} · {categoryLabel(category.itemClass)} · {props.counts[category.code] ?? 0} products{category.description ? ` · ${category.description}` : ""}</p></div>
          <span className="flex gap-3 text-xs"><button type="button" className="text-blue-600" onClick={() => begin(category.id)}>Edit</button>{category.active && <button type="button" className="text-slate-500" onClick={() => start(async () => { await retireCategory(category.id); router.refresh(); })}>Retire</button>}</span>
        </li>)}
        {!props.categories.length && <li className="px-4 py-6 text-sm text-slate-500">No categories yet. Add the standard groups, then rename them.</li>}
      </ul>
      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{current ? "Edit category" : "New category"}</p>
        <label className="block text-xs text-slate-500">Code<input className={field} value={code} onChange={(event) => setCode(event.target.value)} /></label>
        <label className="block text-xs text-slate-500">Name<input className={field} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="block text-xs text-slate-500">Class<select className={field} value={itemClass} onChange={(event) => setClass(event.target.value)}>{CATEGORY_CLASSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="block text-xs text-slate-500">Inside<select className={field} value={parentId} onChange={(event) => setParent(event.target.value)}><option value="">Top level</option>{props.categories.filter((category) => category.id !== editing).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="block text-xs text-slate-500">Description<textarea className={field} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <Button type="submit" variant="primary" disabled={pending}>{pending ? "Saving…" : "Save category"}</Button>
      </form>
    </div>
    <p role={failed ? "alert" : "status"} className={`mt-3 text-xs ${failed ? "text-red-600" : "text-slate-500"}`}>{message}</p>
  </section>;
}
