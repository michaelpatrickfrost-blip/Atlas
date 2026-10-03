/** RFC-style CSV parsing: quotes, escaped quotes, CRLF and embedded newlines. */
export function parseCsv(text:string):Record<string,string>[] {
 if(text.length>2_000_000)throw new Error('CSV must be smaller than 2 MB.');
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++) {
  const char=text[i];
  if(char==='"') {if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell.length)throw new Error('Unexpected quote in CSV.');else quoted=!quoted;}
  else if(!quoted&&char===','){row.push(cell);cell='';}
  else if(!quoted&&(char==='\n'||char==='\r')){if(char==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}
  else cell+=char;
 }
 if(quoted)throw new Error('CSV has an unclosed quoted field.');
 row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 if(rows.length<2)throw new Error('Include a header row and at least one data row.');
 const headers=rows.shift()!.map(h=>h.replace(/^\uFEFF/,'').trim());
 if(headers.some(h=>!h)||new Set(headers).size!==headers.length)throw new Error('CSV headers must be unique and non-empty.');
 if(rows.length>500)throw new Error('Import at most 500 records per file.');
 return rows.map((values,index)=>{if(values.length!==headers.length)throw new Error(`Row ${index+2}: expected ${headers.length} columns, got ${values.length}.`);return Object.fromEntries(headers.map((h,i)=>[h,values[i].trim()]));});
}
export function csvText(rows:string[][]):string {return rows.map(row=>row.map(cell=>/[",\r\n]/.test(cell)?`"${cell.replaceAll('"','""')}"`:cell).join(',')).join('\r\n');}
