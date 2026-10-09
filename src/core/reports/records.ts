import type { Session } from "@/core/auth/session";
import { reportWhere, ReportError } from "./filters";
import { REPORT_EXPORT_LIMIT, REPORT_PAGE_SIZE, type ReportDataset, type ReportRow, type ReportSpec } from "./types";
/** Providers retain their own typed query, tenant predicate and record-visibility rules. */
export function recordDataset<T>(spec: ReportSpec & {anyOf: string[]}, query: (session: Session, where: Record<string,unknown>, take: number, skip: number) => Promise<T[]>, count: (session: Session, where: Record<string,unknown>) => Promise<number>, map: (row:T)=>ReportRow):ReportDataset {
 return {...spec,async read(session,input,exporting){const where=reportWhere(spec,input);const rows=await query(session,where,exporting?REPORT_EXPORT_LIMIT+1:REPORT_PAGE_SIZE,exporting?0:(input.page-1)*REPORT_PAGE_SIZE);if(exporting && rows.length>REPORT_EXPORT_LIMIT)throw new ReportError("Narrow your filters to download up to 10,000 rows.",422);return {rows:rows.map(map),total:exporting?rows.length:await count(session,where)};}};
}
export function money(value: bigint | number): number | string {
 // Exact text preserves large financial values beyond Excel's 15-digit precision.
 const raw=BigInt(value);if(raw>999_999_999_999_999n||raw< -999_999_999_999_999n){const sign=raw<0n?'-':'';const n=raw<0n?-raw:raw;return `${sign}${n/100n}.${String(n%100n).padStart(2,'0')}`;}return Number(raw)/100;
}

export function decimal(value: {toString():string}):number|string {
 const text=value.toString();const digits=text.replace(/[-.]/g,'').replace(/^0+/,'').length;
 return digits>15?text:Number(text);
}
