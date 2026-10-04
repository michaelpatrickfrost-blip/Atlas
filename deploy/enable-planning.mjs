// Operator-only, explicit workspace upgrade. Never infers a licence for other tenants.
import fs from 'node:fs';
import pg from 'pg';
const slug=process.argv[2],actorEmail=process.argv[3];
if(!slug||!actorEmail)throw new Error('Usage: node deploy/enable-planning.mjs <workspace-slug> <administrator-email>');
const env=Object.fromEntries(fs.readFileSync('/etc/atlas-test/migration.env','utf8').trim().split('\n').map(line=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1)];}));
const client=new pg.Client({connectionString:env.DATABASE_URL});await client.connect();
try {
 await client.query('BEGIN');
 const result=await client.query(`SELECT r.id,r."organisationId",r.capabilities,u.id AS actor FROM roles r JOIN organisations o ON o.id=r."organisationId" JOIN memberships m ON m."organisationId"=o.id AND m.active=true JOIN users u ON u.id=m."userId" JOIN roles_on_memberships rm ON rm."membershipId"=m.id AND rm."roleId"=r.id WHERE o.slug=$1 AND r.key='admin' AND u.email=$2 FOR UPDATE OF r`,[slug,actorEmail]);
 if(result.rows.length!==1)throw new Error('A unique active administrator was not found; no change made.');
 const role=result.rows[0];
 if(!role.capabilities.includes('stock.read')||!role.capabilities.includes('core.modules.manage'))throw new Error('Administrator must already have Inventory and module management access.');
 const dependencies=await client.query('SELECT "moduleId" FROM module_states WHERE "organisationId"=$1 AND "moduleId"=ANY($2) AND enabled=true AND entitled=true',[role.organisationId,['stock','sales']]);
 if(dependencies.rows.length!==2)throw new Error('Enable licensed Inventory and Sales before Planning.');
 const capabilities=[...new Set([...role.capabilities,'planning.demand.read','planning.plan.manage','planning.team.manage'])];
 await client.query('UPDATE roles SET capabilities=$1 WHERE id=$2',[capabilities,role.id]);
 await client.query('INSERT INTO module_states (id,"organisationId","moduleId",enabled,entitled,"updatedAt") VALUES ($1,$2,$3,true,true,now()) ON CONFLICT ("organisationId","moduleId") DO UPDATE SET enabled=true,entitled=true,"updatedAt"=now()',[crypto.randomUUID(),role.organisationId,'planning']);
 await client.query('INSERT INTO audit_entries (id,"organisationId","actorUserId",action,"entityType","entityId",before,after) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',[crypto.randomUUID(),role.organisationId,role.actor,'planning.workspace_enabled','Role',role.id,JSON.stringify({capabilities:role.capabilities}),JSON.stringify({capabilities,moduleId:'planning',enabled:true})]);
 await client.query('COMMIT');console.log('Production Planning enabled for the requested workspace; administrator capability added.');
} catch(error){await client.query('ROLLBACK');throw error;}finally{await client.end();}
