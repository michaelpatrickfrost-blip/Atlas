// Operator-only restore drill. Creates and drops only its own temporary database.
import pg from 'pg';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=process.env.DATABASE_URL, backup=process.argv[2];
if(!source||!backup)throw new Error('Specify operator DATABASE_URL and backup path');
const name='atlas_restore_check_20261003';
const admin=new pg.Client({connectionString:source});await admin.connect();let created=false;
try{
 await admin.query(`CREATE DATABASE ${name}`);created=true;
 const target=new URL(source);target.pathname='/'+name;const env={...process.env,DATABASE_URL:target.toString()};
 execFileSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy','--config','prisma7.config.ts'],{env,stdio:'inherit'});
 execFileSync(process.execPath,['scripts/transfer-test-data.mjs','restore',backup],{env,stdio:'inherit'});
 const restored=new pg.Client({connectionString:target.toString()});await restored.connect();
 try{const snapshot=JSON.parse(fs.readFileSync(backup,'utf8'));let total=0;
 for(const [table,rows] of Object.entries(snapshot.tables)){const safe='"'+table.replaceAll('"','""')+'"';const result=await restored.query(`SELECT COUNT(*) FROM ${safe}`);if(Number(result.rows[0].count)!==rows.length)throw new Error('Restore row count mismatch');total+=rows.length;}
 console.log(`Restore drill passed: ${Object.keys(snapshot.tables).length} tables, ${total} records, every table count matched.`);
 }finally{await restored.end();}
}finally{if(created)await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);await admin.end();}
