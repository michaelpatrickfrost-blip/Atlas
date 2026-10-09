import ExcelJS from 'exceljs';
import type { ReportInput, ReportResult } from './types';
export async function reportWorkbook(result:ReportResult,input:ReportInput,company:string) {
 const book=new ExcelJS.Workbook();book.creator='Atlas';book.created=new Date();
 const sheet=book.addWorksheet('Report',{views:[{state:'frozen',ySplit:1}],properties:{defaultRowHeight:22}});
 sheet.columns=result.columns.map(c=>({key:c.key,header:c.label,width:Math.min(42,Math.max(18,c.label.length+4))}));
 sheet.getRow(1).height=30;sheet.getRow(1).eachCell(cell=>{cell.font={bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF075BFF'}};cell.alignment={vertical:'middle'};});
 result.rows.forEach((row,index)=>{const added=sheet.addRow(result.columns.map(c=>row[c.key]));added.eachCell({includeEmpty:true},(cell,column)=>{const type=result.columns[column-1].type;if(type==='money'&&typeof cell.value==='number')cell.numFmt='#,##0.00;[Red](#,##0.00)';if(type==='number')cell.numFmt='#,##0.######';if(type==='date')cell.numFmt='yyyy-mm-dd';if(index%2===1)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF0F6FF'}};cell.alignment={vertical:'middle'};});});
 sheet.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,result.rows.length+1),column:result.columns.length}};
 const details=book.addWorksheet('Report details');details.columns=[{width:24},{width:100}];
 details.addRows([['Atlas report',result.spec.name],['Company',company],['Source',result.spec.source],['Definition',result.spec.description],['Generated (UTC)',new Date().toISOString()],['Rows',result.total],['Search',input.search||'All'],['From (UTC)',input.from||'All'],['Through (UTC)',input.to||'Now / all'],['Summary period',input.period==='all'?'All / current snapshot':`Last ${input.period} days`],['Columns',result.columns.map(c=>c.label).join(', ')],['Field filters',input.filters.map(f=>`${result.spec.columns.find(c=>c.key===f.field)?.label} ${f.operator} ${f.value}`).join('; ')||'None'],['Amounts','Currencies are separate columns. Very large amounts are exact text to preserve precision.']]);
 details.getRow(1).font={bold:true,color:{argb:'FF075BFF'}};details.eachRow(row=>row.alignment={wrapText:true,vertical:'top'});
 return new Uint8Array(await book.xlsx.writeBuffer());
}
