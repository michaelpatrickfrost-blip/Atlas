"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { moveOpportunityStage } from "@/modules/crm/services/opportunities";
import { formatMoney } from "@/core/shared/money";
type Item = { id: string; name: string; stageId: string; valueAmount: number; valueCurrency: string; party: { name: string }; nextActionAt: string | null };
export function PipelineBoard({ stages, items, editable }: { stages: {id:string;name:string}[]; items:Item[]; editable:boolean }) {
 const [dragged,setDragged] = useState<string|null>(null), [over,setOver] = useState<string|null>(null), [message,setMessage] = useState("");
 const [pending,startTransition] = useTransition(); const router = useRouter();
 function move(id:string, stage:string) {
  if (!editable || pending || items.find(i=>i.id===id)?.stageId===stage) return;
  startTransition(async () => { try { await moveOpportunityStage(id,stage); setMessage("Stage updated."); router.refresh(); } catch(e) { setMessage(e instanceof Error ? e.message : "Could not move this opportunity."); } });
 }
 return <div><p role="status" aria-live="polite" className="mb-3 text-xs text-[var(--color-ink-muted)]">{pending ? "Saving stage…" : message || (editable ? "Drag a card to move it. You can also use its stage menu." : "Pipeline overview")}</p><div className="flex gap-4 overflow-x-auto pb-4">{stages.map(stage => {
  const cards = items.filter(i=>i.stageId===stage.id);
  const totals = cards.reduce<Record<string,number>>((sum,i)=>{sum[i.valueCurrency]=(sum[i.valueCurrency]??0)+i.valueAmount;return sum;},{});
  return <section key={stage.id} aria-label={stage.name} onDragOver={e=>{if(editable && !pending){e.preventDefault();setOver(stage.id);}}} onDragLeave={()=>setOver(null)} onDrop={e=>{e.preventDefault();if(dragged)move(dragged,stage.id);setDragged(null);setOver(null);}} className={`min-h-96 w-72 shrink-0 rounded-2xl border p-3 transition-colors ${over===stage.id ? "border-[var(--color-atlas-blue)] bg-[var(--color-atlas-blue-soft)]" : "border-transparent bg-[#eef0f4]"}`}>
   <div className="mb-4 px-1"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{stage.name}</h2><span className="text-xs text-[var(--color-ink-muted)]">{cards.length}</span></div><p className="mt-1 text-xs text-[var(--color-ink-muted)]">{Object.entries(totals).map(([currency,amount])=>formatMoney(amount,currency)).join(" · ") || "No opportunities"}</p></div>
   <div className="space-y-3">{cards.map(item=><article key={item.id} draggable={editable && !pending} onDragStart={e=>{setDragged(item.id);e.dataTransfer.setData("text/plain",item.id);e.dataTransfer.effectAllowed="move";}} onDragEnd={()=>{setDragged(null);setOver(null);}} className={`rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm ${dragged===item.id ? "opacity-40" : ""}`}><div className="flex gap-2"><Link href={`/crm/opportunities/${item.id}`} className="min-w-0 flex-1"><h3 className="text-sm font-medium">{item.name}</h3><p className="mt-1 text-xs text-[var(--color-ink-muted)]">{item.party.name}</p></Link>{editable && <GripVertical size={15} className="cursor-grab text-[var(--color-ink-faint)]"/>}</div><p className="mt-4 text-lg font-semibold tracking-tight">{formatMoney(item.valueAmount,item.valueCurrency)}</p>{!item.nextActionAt && <p className="mt-2 text-xs text-[var(--color-status-warning)]">Add a next action</p>}{editable && <select aria-label={`Stage for ${item.name}`} disabled={pending} value={item.stageId} onChange={e=>move(item.id,e.target.value)} className="mt-3 w-full border border-[var(--color-border)] bg-white p-2 text-xs">{stages.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>}</article>)}</div>
  </section>;
 })}</div></div>;
}
