// Operator-only, executed centrally. Backups and database credentials stay on server.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import pg from 'pg';
const release=process.argv[2];if(!release||!/^\/opt\/atlas-test\/data-releases\/scheduling-budget-[a-z0-9-]+$/.test(release))throw Error('Expected isolated Scheduling budget release.');
const migration='20261003410000_scheduling_hours_budgets';
const env=Object.fromEntries(fs.readFileSync('/etc/atlas-test/migration.env','utf8').trim().split('\n').map(line=>{const i=line.indexOf('=');return[line.slice(0,i),line.slice(i+1)]}));
const backup='/var/backups/atlas-test/pre-'+path.basename(release);fs.mkdirSync(backup,{recursive:true,mode:0o700});
execFileSync('/usr/bin/pg_dump',['--dbname',env.DATABASE_URL,'--format=custom','--file',backup+'/database.dump'],{stdio:['ignore','ignore','pipe']});execFileSync('/usr/bin/pg_restore',['--list',backup+'/database.dump'],{stdio:'ignore'});
fs.writeFileSync(backup+'/previous-release.txt',fs.realpathSync('/opt/atlas-test/current')+'\n',{mode:0o600});fs.copyFileSync('/etc/systemd/system/atlas-test.service',backup+'/atlas-test.service');
const sql=fs.readFileSync(path.join(release,'prisma/migrations',migration,'migration.sql'),'utf8'),db=new pg.Client({connectionString:env.DATABASE_URL});await db.connect();
const test='atlas_budget_restore_'+Date.now(),url=new URL(env.DATABASE_URL);url.pathname='/'+test;
try{
 await db.query(`CREATE DATABASE "${test}"`);
 execFileSync('/usr/bin/pg_restore',['--dbname',url.toString(),'--exit-on-error',backup+'/database.dump'],{stdio:['ignore','ignore','pipe']});
 const check=new pg.Client({connectionString:url.toString()});await check.connect();try{
  const exists=(await check.query('SELECT to_regclass($1) AS name',['public.scheduling_hours_budgets'])).rows[0].name;if(!exists)await check.query(sql);
  const tables=(await check.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")).rows[0].count;console.log('Actual-schema backup restored; additive budget migration accepted ('+tables+' tables).');
 }finally{await check.end();}
}finally{await db.query(`DROP DATABASE IF EXISTS "${test}" WITH (FORCE)`);await db.end();}
// Scope migration deploy to this reviewed addition, not other contributors' pending work.
const scope=path.join(release,'budget-migration-scope');fs.mkdirSync(path.join(scope,'prisma/migrations',migration),{recursive:true});fs.writeFileSync(path.join(scope,'prisma/migrations',migration,'migration.sql'),sql);fs.writeFileSync(path.join(scope,'prisma/migrations/migration_lock.toml'),'provider = "postgresql"\n');fs.copyFileSync(path.join(release,'prisma/schema.prisma'),path.join(scope,'prisma/schema.prisma'));fs.copyFileSync(path.join(release,'prisma7.config.ts'),path.join(scope,'prisma7.config.ts'));
execFileSync('/usr/bin/node',['/opt/atlas-test/node_modules/prisma/build/index.js','migrate','deploy','--config',path.join(scope,'prisma7.config.ts')],{cwd:scope,env:{...process.env,DATABASE_URL:env.DATABASE_URL},stdio:['ignore','inherit','pipe']});
console.log('Protected restore check and reviewed budget migration complete. Runtime not switched.');
