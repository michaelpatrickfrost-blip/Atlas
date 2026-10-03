// One-time upgrade of the original demo administrator; never resets custom roles.
import 'dotenv/config';
import pg from 'pg';
const client=new pg.Client({connectionString:process.env.DATABASE_URL});await client.connect();
try{
 await client.query('BEGIN');
 const result=await client.query(`SELECT r.id,r."organisationId",r.capabilities,u.id AS actor FROM roles r JOIN organisations o ON o.id=r."organisationId" JOIN memberships m ON m."organisationId"=o.id JOIN users u ON u.id=m."userId" WHERE o.slug='demo' AND o.name='Northbridge Group' AND r.key='admin' AND u.email='demo@atlas.app' FOR UPDATE OF r`);
 if(result.rows.length!==1)throw new Error('Original demo administrator not found; no role changed');
 const role=result.rows[0],required=['sales.order.read','sales.order.create','sales.order.edit_draft','sales.order.confirm','sales.order.amend','sales.order.cancel','sales.order.price_override','sales.order.hold.read','sales.order.hold.manage','sales.order.approval.request','sales.order.approval.approve'];
 const added=required.filter(c=>!role.capabilities.includes(c));
 if(added.length){const capabilities=[...role.capabilities,...added];await client.query('UPDATE roles SET capabilities=$1 WHERE id=$2',[capabilities,role.id]);await client.query('INSERT INTO audit_entries (id,"organisationId","actorUserId",action,"entityType","entityId",before,after) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',[crypto.randomUUID(),role.organisationId,role.actor,'role.demo_sales_upgrade','Role',role.id,JSON.stringify({capabilities:role.capabilities}),JSON.stringify({capabilities,added})]);}
 await client.query('COMMIT');console.log(`Demo administrator Sales permissions upgraded: ${added.length} additions.`);
}catch(error){await client.query('ROLLBACK');throw error;}finally{await client.end();}
