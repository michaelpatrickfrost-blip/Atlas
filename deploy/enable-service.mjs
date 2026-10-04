// Operator-only activation for the specified existing administrator workspace.
// Does not assign roles to other users or broaden Customer Master/source rights.
import fs from 'node:fs';
import pg from 'pg';
import crypto from 'node:crypto';
const [slug,email]=process.argv.slice(2);
if(!slug||!email)throw new Error('Specify workspace slug and an active administrator email.');
const env=Object.fromEntries(fs.readFileSync('/etc/atlas-test/migration.env','utf8').trim().split('\n').map(line=>{const i=line.indexOf('=');return[line.slice(0,i),line.slice(i+1)];}));
const client=new pg.Client({connectionString:env.DATABASE_URL});await client.connect();
const serviceCapabilities=['service.case.read','service.case.create','service.case.update','service.case.assign','service.case.resolve','service.case.close','service.case.restricted','service.case.note','service.case.communication','service.ticket.read','service.ticket.create','service.ticket.update','service.queue.manage'];
try {
 await client.query('BEGIN');
 const result=await client.query(`SELECT r.id,r."organisationId",r.capabilities,u.id AS actor FROM roles r JOIN organisations o ON o.id=r."organisationId" JOIN memberships m ON m."organisationId"=o.id AND m.active=true JOIN users u ON u.id=m."userId" JOIN roles_on_memberships rm ON rm."membershipId"=m.id AND rm."roleId"=r.id WHERE o.slug=$1 AND r.key='admin' AND u.email=$2 FOR UPDATE OF r`,[slug,email]);
 if(result.rows.length!==1)throw new Error('Unique active administrator required; no change made.');
 const role=result.rows[0];
 if(!role.capabilities.includes('core.modules.manage')||!role.capabilities.includes('customers.read'))throw new Error('Existing module-management and Customer Master access required.');
 // A shared role must not silently grant new access to unrelated people.
 const holders=await client.query('SELECT count(*)::int AS count FROM roles_on_memberships WHERE "roleId"=$1',[role.id]);
 if(holders.rows[0].count!==1)throw new Error('Administrator role is shared. Plan an individual grant instead.');
 if(!(await client.query("SELECT to_regclass('public.service_cases') AS table")).rows[0].table)throw new Error('Apply the reviewed Customer Service migration first.');
 const capabilities=[...new Set([...role.capabilities,...serviceCapabilities])];
 await client.query('UPDATE roles SET capabilities=$1 WHERE id=$2',[capabilities,role.id]);
 await client.query('INSERT INTO module_states (id,"organisationId","moduleId",enabled,entitled,"updatedAt") VALUES ($1,$2,$3,true,true,now()) ON CONFLICT ("organisationId","moduleId") DO UPDATE SET enabled=true,entitled=true,"updatedAt"=now()',[crypto.randomUUID(),role.organisationId,'service']);
 await client.query('INSERT INTO audit_entries (id,"organisationId","actorUserId",action,"entityType","entityId",before,after) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',[crypto.randomUUID(),role.organisationId,role.actor,'service.workspace.enabled','Role',role.id,JSON.stringify({capabilities:role.capabilities}),JSON.stringify({capabilities,moduleId:'service',enabled:true})]);
 await client.query('COMMIT');console.log('Customer Service enabled for the specified administrator workspace; existing source-data permissions preserved.');
} catch(error) {await client.query('ROLLBACK');throw error;} finally {await client.end();}
