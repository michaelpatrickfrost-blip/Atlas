import { visiblePointers, type SalesPointerSurface, type SalesPointers } from "@/modules/sales/domain/pointers";

export function SalesPointerNotes({ pointers, surface }: { pointers: SalesPointers; surface: SalesPointerSurface }) {
  const notes = visiblePointers(pointers, surface);
  if (!notes.length) return null;
  return (
    <aside className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
      <h2 className="text-sm font-semibold text-slate-700">Sales pointers</h2>
      <ul className="mt-3 space-y-2">
        {notes.map((note) => (
          <li key={note.key} className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">{note.label}.</span> {note.detail}
          </li>
        ))}
      </ul>
    </aside>
  );
}
