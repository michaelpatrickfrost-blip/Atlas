import EmbeddedPostgres from 'embedded-postgres';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn,execFileSync} from 'node:child_process';
// A disposable synthetic test cluster. Never connects to Atlas business storage.
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-projects-synthetic-'));
const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const cluster=new EmbeddedPostgres({databaseDir:path.join(directory,'db'),user:'synthetic',password:'synthetic-only',port,persistent:false,onLog:()=>{},onError:()=>{}});
let client,preview;
try{
 await cluster.initialise();await cluster.start();await cluster.createDatabase('projects_synthetic');
 const {Client}=await import('pg');client=new Client({host:'127.0.0.1',port,user:'synthetic',password:'synthetic-only',database:'projects_synthetic'});client.on('error',()=>{});await client.connect();
 const prisma=path.resolve('node_modules/prisma/build/index.js'),base=process.env.ATLAS_PROJECTS_MIGRATION_BASE;
 const sql=execFileSync(process.execPath,[prisma,'migrate','diff','--config','prisma7.config.ts','--from-empty','--to-schema',base??'prisma/schema.prisma','--script'],{encoding:'utf8'});await client.query(sql);
 if(base){await client.query(fs.readFileSync('prisma/migrations/20261003330000_projects_work_management/migration.sql','utf8'));console.log('Projects additive migration applied to disposable synthetic baseline.');}
 execFileSync(process.execPath,[path.resolve('node_modules/vitest/vitest.mjs'),'run','tests/projects-database.integration.test.ts'],{stdio:'inherit',env:{...process.env,ATLAS_RUNTIME:'test',ATLAS_PROJECTS_SYNTHETIC_TEST:'1',DATABASE_URL:`postgresql://synthetic:synthetic-only@127.0.0.1:${port}/projects_synthetic`}});
 if(process.argv.includes('--preview')){
  const bcrypt=await import('bcryptjs');const password=await bcrypt.default.hash('atlas-demo',10);
  await client.query(`INSERT INTO organisations(id,name,slug,"updatedAt") VALUES ('preview-org','Synthetic Projects Preview','synthetic-projects-preview',now());`);
  await client.query('INSERT INTO users(id,email,name,"passwordHash","updatedAt") VALUES ($1,$2,$3,$4,now())',['preview-user','demo@atlas.app','Michael · synthetic preview',password]);
  await client.query(`INSERT INTO memberships(id,"organisationId","userId") VALUES ('preview-member','preview-org','preview-user');
  INSERT INTO roles(id,"organisationId",key,name,capabilities) VALUES ('preview-role','preview-org','preview','Preview',ARRAY['core.profile.self','projects.read','projects.manage','core.audit.read']);
  INSERT INTO roles_on_memberships("membershipId","roleId") VALUES ('preview-member','preview-role');
  INSERT INTO module_states(id,"organisationId","moduleId",enabled,entitled,"updatedAt") VALUES ('preview-module','preview-org','projects',true,true,now());
  INSERT INTO projects(id,"organisationId",name,reference,"ownerUserId",visibility,status,notes,"targetAt","updatedAt") VALUES ('preview-project','preview-org','Warehouse Expansion','PRJ-PREVIEW','preview-user','PRIVATE','ACTIVE','Move the warehouse with clear handoffs and no interruption to customer service.',now()+interval '30 days',now());
  INSERT INTO project_tasks(id,"organisationId","projectId",title,"assigneeUserId","creatorUserId",status,"estimatedMinutes","dueAt","updatedAt") VALUES ('preview-task','preview-org','preview-project','Approve racking supplier','preview-user','preview-user','IN_PROGRESS',90,now()+interval '1 day',now()),('preview-task-2','preview-org','preview-project','Review electrical installation','preview-user','preview-user','WAITING',240,now()+interval '3 days',now()),('preview-task-3','preview-org','preview-project','Confirm warehouse layout','preview-user','preview-user','DONE',60,now()-interval '1 day',now());
  INSERT INTO projects_milestones(id,"organisationId","projectId",name,"targetAt","ownerUserId") VALUES ('preview-milestone','preview-org','preview-project','Racking installation',now()+interval '10 days','preview-user');`);
  const url=`postgresql://synthetic:synthetic-only@127.0.0.1:${port}/projects_synthetic`;
  preview=spawn(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','15320'],{stdio:'inherit',env:{...process.env,ATLAS_RUNTIME:'preview',DATABASE_URL:url,SESSION_SECRET:'synthetic-preview-secret-with-over-32-characters',ATLAS_PRIVATE_TUNNEL:'1'}});
  console.log('Disposable synthetic preview: http://127.0.0.1:15320/projects');
  await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve);preview.once('exit',resolve);});
 }
}finally{if(preview)preview.kill('SIGTERM');if(client)await client.end().catch(()=>{});await cluster.stop().catch(()=>{});fs.rmSync(directory,{recursive:true,force:true});}
