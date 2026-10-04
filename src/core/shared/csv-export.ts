import { csvText } from './csv';
/** Text cells are protected against spreadsheet formula interpretation. */
export function exportCsv(rows:Array<Array<string|number>>):string {
 return '\uFEFF'+csvText(rows.map(row=>row.map(value=>typeof value==='number'?String(value):/^[\s]*[=+@-]/.test(value)||/^[\t\r\n]/.test(value)?`'${value}`:value)));
}
export function csvResponse(filename:string,rows:Array<Array<string|number>>) {
 return new Response(exportCsv(rows),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
