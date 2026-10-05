import { csvText } from './csv';
type Cell=string|number;
/** Text cells are protected against spreadsheet formula interpretation. */
const safe=(value:Cell)=>typeof value==='number'?value:/^[\s]*[=+@-]/.test(value)||/^[\t\r\n]/.test(value)?`'${value}`:value;
export function exportCsv(rows:Array<Array<Cell>>):string {
 return '﻿'+csvText(rows.map(row=>row.map(value=>String(safe(value)))));
}
const headers=(type:string,filename:string)=>({'Content-Type':type,'Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
/** A table download. With the request it honours `format=xlsx`, `format=headers` (the column names, for
 * the column chooser) and `columns=` (header names joined by `|`, in the order to export). */
export function csvResponse(filename:string,rows:Array<Array<Cell>>,request?:Request):Response|Promise<Response> {
 const params=request?new URL(request.url).searchParams:null,format=params?.get('format')??'csv',head=(rows[0]??[]).map(String);
 if(format==='headers')return Response.json({columns:head},{headers:{'Cache-Control':'private, no-store'}});
 const wanted=(params?.get('columns')??'').split('|').map(name=>head.indexOf(name)).filter(index=>index>=0);
 const table=wanted.length?rows.map(row=>wanted.map(index=>row[index]??'')):rows;
 if(format!=='xlsx')return new Response(exportCsv(table),{headers:headers('text/csv; charset=utf-8',filename)});
 return (async()=>{
  const {Workbook}=await import('exceljs'),book=new Workbook(),sheet=book.addWorksheet('Export');
  table.forEach(row=>sheet.addRow(row.map(safe)));
  sheet.getRow(1).font={bold:true};sheet.views=[{state:'frozen',ySplit:1}];
  sheet.columns.forEach((column,index)=>{column.width=Math.min(60,Math.max(10,...table.slice(0,200).map(row=>String(row[index]??'').length+2)));});
  return new Response(Buffer.from(await book.xlsx.writeBuffer()),{headers:headers('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',filename.replace(/\.csv$/,'.xlsx'))});
 })();
}
