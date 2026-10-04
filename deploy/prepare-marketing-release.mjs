// Run on the central server. Backups/records never leave that server.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import pg from 'pg';
const release=process.argv[2];if(!release||!/^\/opt\/atlas-test\/data-releases\/marketing-[a-z0-9-]+$/.test(release))throw Error('Expected an isolated Marketing release path.');
const env=Object.fromEntries(fs.readFileSync('/etc/atlas-test/migration.env','utf8').trim().split('\n').map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)]}));
const backup='/var/backups/atlas-test/pre-'+path.basename(release);fs.mkdirSync(backup,{recursive:true,mode:0o700});
try{execFileSync('/usr/bin/pg_dump',['--dbname',env.DATABASE_URL,'--format=custom','--file',backup+'/database.dump'],{stdio:['ignore','ignore','pipe']});}catch{throw Error('Protected server backup failed; no migration performed.');}
fs.writeFileSync(backup+'/previous-release.txt',fs.realpathSync('/opt/atlas-test/current')+'\n',{mode:0o600});fs.copyFileSync('/etc/systemd/system/atlas-test.service',backup+'/atlas-test.service');fs.cpSync(release+'/prisma',backup+'/prisma',{recursive:true});execFileSync('/usr/bin/pg_restore',['--list',backup+'/database.dump'],{stdio:'ignore'});
const client=new pg.Client({connectionString:env.DATABASE_URL});await client.connect();try{
 const applied=new Set((await client.query('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL')).rows.map(r=>r.migration_name));const pending=fs.readdirSync(release+'/prisma/migrations').filter(n=>fs.existsSync(release+'/prisma/migrations/'+n+'/migration.sql')&&!applied.has(n));
 const reviewed=new Set(['20261003340000_customer_service_core','20261003350000_management_groups','20261003360000_marketing_foundation','20261003370000_marketing_execution_safety']);if(pending.some(n=>!reviewed.has(n)))throw Error('Unexpected pending migration; preserve backup and review before applying.');console.log('Reviewed pending migrations: '+pending.join(', '));
 }finally{await client.end();}
try{execFileSync('/usr/bin/node',['/opt/atlas-test/node_modules/prisma/build/index.js','migrate','deploy','--config',release+'/prisma7.config.ts'],{cwd:release,env:{...process.env,DATABASE_URL:env.DATABASE_URL},stdio:['ignore','inherit','pipe']});}catch{throw Error('Migration failed; protected backup preserved. Do not activate this release.');}
console.log('Protected backup verified; reviewed pending migrations applied (or already present). No runtime switched.');
