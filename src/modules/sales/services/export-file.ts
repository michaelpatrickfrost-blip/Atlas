import ExcelJS from 'exceljs';
export type ExportColumn={key:string;label:string;type?:'money'|'number'|'date'};
export type ExportRow=Record<string,string|number|Date|null|undefined>;
export function exportCsv(columns:ExportColumn[],rows:ExportRow[]){const cell=(value:unknown)=>{let text=value instanceof Date?value.toISOString():String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};return '\uFEFF'+[columns.map(c=>cell(c.label)).join(','),...rows.map(row=>columns.map(c=>cell(row[c.key])).join(','))].join('\r\n');}
export async function exportWorkbook(columns:ExportColumn[],rows:ExportRow[],title:string){
 const book=new ExcelJS.Workbook();book.creator='Atlas';book.created=new Date();book.title=title;
 const sheet=book.addWorksheet(title.slice(0,31),{views:[{state:'frozen',ySplit:1}]});sheet.columns=columns.map(c=>({header:c.label,key:c.key,width:c.type==='money'?19:c.key==='customer'?34:24}));
 rows.forEach(row=>sheet.addRow(columns.map(c=>row[c.key]??'')));
 const header=sheet.getRow(1);header.font={bold:true,color:{argb:'FFFFFFFF'}};header.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF2456D4'}};header.height=26;
 sheet.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,rows.length+1),column:columns.length}};
 columns.forEach((c,i)=>{if(c.type==='money')sheet.getColumn(i+1).numFmt='#,##0.00';if(c.type==='date')sheet.getColumn(i+1).numFmt='dd/mm/yyyy';});
 sheet.eachRow((row,i)=>{if(i>1){row.height=22;if(i%2===0)row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF3F6FB'}};}});
 return Buffer.from(await book.xlsx.writeBuffer());
}
