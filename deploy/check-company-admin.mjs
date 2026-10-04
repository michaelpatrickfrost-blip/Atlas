// Isolated synthetic acceptance on the server; no business records exported to Mac.
import fs from 'node:fs';import pg from 'pg';import assert from 'node:assert/strict';
const endpoint=process.argv[2]??'http://127.0.0.1:3103';if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(endpoint))throw Error('Private loopback only');
const env=Object.fromEntries(fs.readFileSync('/etc/atlas-test/migration.env','utf8').trim().split('\n').map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)]}));const c=new pg.Client({connectionString:env.DATABASE_URL});await c.connect();
const identities=[],stamp=crypto.randomUUID();const form=entries=>({__atlas:'form',entries:Object.entries(entries).flatMap(([k,v])=>(Array.isArray(v)?v:[v]).map(x=>[k,String(x)]))});
async function action(cookie,key,args){const r=await fetch(endpoint+'/api/desktop/action',{method:'POST',headers:{'Content-Type':'application/json','X-Atlas-Client':'desktop',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify({action:key,args})});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function ok(cookie,key,args){const r=await action(cookie,key,args);assert.equal(r.status,200,key+': '+JSON.stringify(r.body));return r.body.value;}
async function blocked(cookie,key,args){const r=await action(cookie,key,args);assert(r.status>=400,key+' unexpectedly allowed');}
async function signup(suffix){const email=`hr-${stamp}-${suffix}@example.invalid`,password=crypto.randomUUID()+crypto.randomUUID();identities.push(email);const r=await action(null,'src/app/(auth)/signup/actions:signup',[{error:''},form({name:'Synthetic '+suffix,company:'Synthetic HR '+stamp+' '+suffix,email,password})]);assert.equal(r.body.redirect,'/home',JSON.stringify(r.body));assert(r.cookie);const row=(await c.query('SELECT u.id AS userid,m.id AS membership,m."organisationId" AS org FROM users u JOIN memberships m ON m."userId"=u.id WHERE u.email=$1',[email])).rows[0];return {...row,email,password,cookie:r.cookie};}
async function moveUser(user,org,caps){await c.query('DELETE FROM roles_on_memberships WHERE "membershipId"=$1',[user.membership]);await c.query('DELETE FROM memberships WHERE id=$1',[user.membership]);await c.query('DELETE FROM roles WHERE "organisationId"=$1',[user.org]);await c.query('DELETE FROM organisations WHERE id=$1',[user.org]);user.org=org;user.membership=crypto.randomUUID();await c.query('INSERT INTO memberships (id,"organisationId","userId",active,"grantedCapabilities","deniedCapabilities") VALUES ($1,$2,$3,true,$4,$5)',[user.membership,org,user.userid,caps,[]]);const role=crypto.randomUUID();await c.query('INSERT INTO roles (id,"organisationId",key,name,capabilities) VALUES ($1,$2,$3,$4,$5)',[role,org,'synthetic-'+role,'Synthetic',caps]);await c.query('INSERT INTO roles_on_memberships ("membershipId","roleId") VALUES ($1,$2)',[user.membership,role]);const login=await action(null,'src/core/auth/actions:loginAction',[form({email:user.email,password:user.password})]);assert(login.cookie,JSON.stringify(login.body));user.cookie=login.cookie;}
const adminKey='src/app/(app)/settings/user-actions:';
try{
 const admin=await signup('admin'),foreign=await signup('foreign');
 const email=`admin-${stamp}-managed@example.invalid`;identities.push(email);
 const created=await ok(admin.cookie,adminKey+'createManagedUser',[form({name:'Synthetic managed user',email})]);assert(created.code&&created.membershipId);
 const pass=crypto.randomUUID()+crypto.randomUUID();const reset='src/core/auth/security-actions:completePasswordRecovery';
 await ok(null,reset,[form({code:created.code,password:pass,confirmPassword:pass})]);await blocked(null,reset,[form({code:created.code,password:pass,confirmPassword:pass})]);
 async function login(){const r=await action(null,'src/core/auth/actions:loginAction',[form({email,password:pass})]);assert(r.cookie);return r.cookie;}
 let cookie=await login();
 await blocked(foreign.cookie,adminKey+'setUserStatus',[form({membershipId:created.membershipId,status:'SUSPENDED'})]);
 await blocked(cookie,adminKey+'saveUserAccess',[form({membershipId:admin.membership})]);
 await ok(admin.cookie,adminKey+'saveUserAccess',[form({membershipId:created.membershipId,capability:['customers.read','people.team.manage']})]);
 assert.equal((await fetch(endpoint+'/api/desktop/session',{headers:{Cookie:cookie,'X-Atlas-Client':'desktop'}})).status,401);cookie=await login();
 await ok(admin.cookie,adminKey+'saveManagementGroup',[form({name:'Synthetic oversight',managerId:created.membershipId})]);
 const group=(await c.query('SELECT id FROM work_teams WHERE "organisationId"=$1 AND name=$2',[admin.org,'Synthetic oversight'])).rows[0];assert(group);
 assert.equal((await c.query('SELECT "isManager" FROM work_team_members WHERE "teamId"=$1 AND "membershipId"=$2',[group.id,created.membershipId])).rows[0].isManager,true);
 await blocked(foreign.cookie,adminKey+'saveManagementGroup',[form({groupId:group.id,name:'Must reject'})]);
 const query=await fetch(endpoint+'/api/desktop/query',{method:'POST',headers:{'Content-Type':'application/json','X-Atlas-Client':'desktop',Cookie:admin.cookie},body:JSON.stringify({model:'passwordReset',method:'findMany',args:{}})});assert.equal(query.status,403);
 await ok(admin.cookie,adminKey+'setUserStatus',[form({membershipId:created.membershipId,status:'SUSPENDED'})]);assert.equal((await fetch(endpoint+'/api/desktop/session',{headers:{Cookie:cookie,'X-Atlas-Client':'desktop'}})).status,401);
 await ok(admin.cookie,adminKey+'setUserStatus',[form({membershipId:created.membershipId,status:'ACTIVE'})]);cookie=await login();
 await ok(admin.cookie,adminKey+'revokeUserSessions',[form({membershipId:created.membershipId})]);assert.equal((await fetch(endpoint+'/api/desktop/session',{headers:{Cookie:cookie,'X-Atlas-Client':'desktop'}})).status,401);
 await blocked(null,adminKey+'createManagedUser',[form({name:'Must reject',email:'unauth@example.invalid'})]);assert.equal((await fetch(endpoint+'/settings')).status,404);
 console.log('PASS: account creation, single-use setup, permission enforcement, tenant isolation, management groups, protected recovery records, suspension/resumption and session revocation; UI absent from server.');
}finally{
 for(const email of identities){const rows=(await c.query('SELECT u.id AS userid,m."organisationId" AS org FROM users u LEFT JOIN memberships m ON m."userId"=u.id WHERE u.email=$1',[email])).rows;for(const row of rows){if(row.org){await c.query('DELETE FROM roles_on_memberships WHERE "membershipId" IN (SELECT id FROM memberships WHERE "organisationId"=$1)',[row.org]);await c.query('DELETE FROM roles WHERE "organisationId"=$1',[row.org]);await c.query('DELETE FROM organisations WHERE id=$1',[row.org]);}await c.query('DELETE FROM users WHERE id=$1',[row.userid]);}}
 await c.end();console.log('Synthetic administration fixtures removed.');
}
