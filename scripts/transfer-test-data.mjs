// One-time transfer to a NEW, EMPTY Atlas test database. Never merges or overwrites data.
import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs/promises';
const [mode,file]=process.argv.slice(2);
if(!['export','restore'].includes(mode)||!file)throw new Error('Use export|restore and a private file path');
const client=new pg.Client({connectionString:process.env.DATABASE_URL});await client.connect();
const quote=value=>'"'+value.replaceAll('"','""')+'"';
try {
 const {rows:tables}=await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations' ORDER BY table_name");
 if(mode==='export') {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const data={version:1,tables:{}};
  for(const {table_name:name} of tables){const result=await client.query(`SELECT * FROM ${quote(name)}`);data.tables[name]=result.rows;}
  await client.query('COMMIT');
  await fs.writeFile(file,JSON.stringify(data),{mode:0o600});
  console.log(`Exported ${tables.length} Atlas tables to a protected transfer file.`);
 } else {
  const data=JSON.parse(await fs.readFile(file,'utf8'));
  if(data.version!==1 || !data.tables)throw new Error('Unsupported transfer file');
  if(Object.keys(data.tables).sort().join('|')!==tables.map(t=>t.table_name).sort().join('|'))throw new Error('Source/destination table sets differ');
  await client.query('BEGIN');
  for(const {table_name:name} of tables){const result=await client.query(`SELECT count(*) FROM ${quote(name)}`);if(Number(result.rows[0].count)!==0)throw new Error('Destination is not empty; refusing to overwrite');}
  // The dedicated bootstrap administrator restores an intact snapshot with circular FK relations.
  await client.query("SET LOCAL session_replication_role='replica'");
  let count=0;
  for(const {table_name:name} of tables){
   const {rows:columns}=await client.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",[name]);
   for(const row of data.tables[name]){
    const keys=Object.keys(row);if(keys.some(k=>!columns.some(c=>c.column_name===k)))throw new Error('Unknown source column');
    const values=keys.map(k=>columns.find(c=>c.column_name===k).data_type.includes('json')&&row[k]!==null?JSON.stringify(row[k]):row[k]);
    await client.query(`INSERT INTO ${quote(name)} (${keys.map(quote).join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,values);count++;
   }
  }
  await client.query('COMMIT');console.log(`Restored ${count} records into the empty Atlas test database.`);
 }
} catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{await client.end();}
