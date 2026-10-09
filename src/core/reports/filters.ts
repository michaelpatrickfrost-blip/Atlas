import type { ReportColumn, ReportInput, ReportSpec } from "./types";
export class ReportError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function dateValue(value: string) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ReportError("Choose a valid date.");
 const date = new Date(`${value}T00:00:00.000Z`);
 if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new ReportError("Choose a valid date.");
 return date;
}
export function parseReportInput(params: URLSearchParams): ReportInput {
 const allowed = new Set(["dataset","search","from","to","period","filters","columns","page","download"]);
 for (const key of params.keys()) if (!allowed.has(key)) throw new ReportError("Unknown report option.");
 let filters: unknown;
 try { filters = JSON.parse(params.get("filters") || "[]"); } catch { throw new ReportError("Check your field filters."); }
 if (!Array.isArray(filters) || filters.length > 12 || filters.some(f => !f || typeof f !== "object" || Object.keys(f).some(k=>!["field","operator","value"].includes(k)) || typeof f.field !== "string" || typeof f.operator !== "string" || typeof f.value !== "string" || f.value.length > 200)) throw new ReportError("Check your field filters (up to 12).");
 const page = Number(params.get("page") || 1);
 if (!Number.isInteger(page) || page < 1 || page > 100_000) throw new ReportError("Choose a valid page.");
 const input = {dataset:params.get("dataset")||"",search:(params.get("search")||"").trim(),from:params.get("from")||"",to:params.get("to")||"",period:params.get("period")||"all",filters,columns:(params.get("columns")||"").split(",").filter(Boolean),page} as ReportInput;
 if (input.search.length > 200 || input.columns.length > 50) throw new ReportError("Report options are too long.");
 if (!['all','30','90','365'].includes(input.period)) throw new ReportError("Choose a valid summary period.");
 if(input.from)dateValue(input.from);if(input.to)dateValue(input.to);
 if(input.from && input.to && input.from>input.to)throw new ReportError("The end date must follow the start date.");
 return input;
}
function nested(path: string, value: unknown): Record<string, unknown> { return path.split('.').reduceRight<Record<string,unknown>>((v,key)=>({[key]:v}),value as Record<string,unknown>); }
function fieldValue(column: ReportColumn, value: string): string | number | boolean | Date {
 if(column.values && !column.values.includes(value))throw new ReportError('Choose an available field value.');
 if(column.type==='date')return dateValue(value);
 if(column.type==='boolean'){if(!['true','false'].includes(value))throw new ReportError("Use true or false for this field.");return value==='true';}
 if(column.type==='number' || column.type==='money'){if(!value.trim() || !Number.isFinite(Number(value)) || (column.integer && !Number.isSafeInteger(Number(value))))throw new ReportError("Enter a valid number.");return Number(value);}
 return value;
}
export function selectedReportColumns(spec: ReportSpec, input: ReportInput) {
 if(new Set(input.columns).size!==input.columns.length || input.columns.some(k=>!spec.columns.some(c=>c.key===k)))throw new ReportError("Choose available report columns.");
 const selected=input.columns.length ? input.columns.map(k=>spec.columns.find(c=>c.key===k)!) : [...spec.columns];
 for(const column of [...selected])if(column.currencyKey&&!selected.some(c=>c.key===column.currencyKey)){const currency=spec.columns.find(c=>c.key===column.currencyKey);if(!currency)throw new ReportError('Currency is unavailable for this amount.',503);selected.push(currency);}
 return selected;
}
export function reportWhere(spec: ReportSpec, input: ReportInput): Record<string, unknown> {
 selectedReportColumns(spec,input);
 if(!spec.dateField && (input.from||input.to))throw new ReportError("This dataset does not support a date range.");
 if(!spec.summary && input.period!=='all')throw new ReportError("Use a date range for records.");
 const clauses: Record<string,unknown>[]=[];
 if(input.search){const columns=spec.columns.filter(c=>c.searchable&&c.path);if(!columns.length)throw new ReportError("This dataset does not support search.");clauses.push({OR:columns.map(c=>nested(c.path!,{contains:input.search,mode:'insensitive'}))});}
 if(spec.dateField && (input.from||input.to)){const range:Record<string,Date>={};if(input.from)range.gte=dateValue(input.from);if(input.to){range.lt=new Date(dateValue(input.to).getTime()+86_400_000);}clauses.push(nested(spec.dateField,range));}
 for(const filter of input.filters){const column=spec.columns.find(c=>c.key===filter.field);if(!column?.path)throw new ReportError("This field cannot be filtered.");const type=column.type||'text';if(!['equals',...(type==='text'&&column.searchable?['contains']:[]),...(['date','number','money'].includes(type)?['gte','lte']:[])].includes(filter.operator))throw new ReportError("Choose a supported field operator.");const value=fieldValue(column,filter.value);const operator=filter.operator==='equals'?'equals':filter.operator==='lte'&&type==='date'?'lt':filter.operator;const effective=filter.operator==='lte'&&type==='date'?new Date((value as Date).getTime()+86_400_000):value;clauses.push(nested(column.path,filter.operator==='equals'&&type==='date'?{gte:value,lt:new Date((value as Date).getTime()+86_400_000)}:{[operator]:effective,...(filter.operator==='contains'?{mode:'insensitive'}:{})}));}
 return clauses.length?{AND:clauses}:{};
}
