// Isolated synthetic server-side acceptance. Never copies business data to the Mac.
import fs from 'node:fs';
import pg from 'pg';
import assert from 'node:assert/strict';
const endpoint=process.argv[2]??'http://127.0.0.1:3102';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(endpoint))throw new Error('Use the private loopback candidate.');
const env=Object.fromEntries(fs.readFileSync('/etc/atlas-test/migration.env','utf8').trim().split('\n').map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)]}));
const client=new pg.Client({connectionString:env.DATABASE_URL});await client.connect();
const identities=[];const stamp=crypto.randomUUID();
const form=entries=>({__atlas:'form',entries:Object.entries(entries)});
async function action(cookie,key,args){const response=await fetch(`${endpoint}/api/desktop/action`,{method:'POST',headers:{'Content-Type':'application/json','X-Atlas-Client':'desktop',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify({action:key,args})});const body=await response.json();return {status:response.status,body,cookie:response.headers.get('set-cookie')?.split(';')[0]};}
async function ok(cookie,key,args){const result=await action(cookie,key,args);assert.equal(result.status,200,`${key}: ${result.body.error}`);return result.body.value;}
async function signup(suffix){const email=`planning-${stamp}-${suffix}@example.invalid`;identities.push(email);const result=await action(null,'src/app/(auth)/signup/actions:signup',[{error:''},form({name:'Synthetic Planner',company:`Synthetic Planning ${stamp} ${suffix}`,email,password:crypto.randomUUID()+crypto.randomUUID()})]);assert.equal(result.status,200);assert.equal(result.body.redirect,'/home');assert(result.cookie);const {rows}=await client.query('SELECT m.id AS membership,m."organisationId" AS org,u.id AS userid FROM memberships m JOIN users u ON u.id=m."userId" WHERE u.email=$1',[email]);assert.equal(rows.length,1);return {...rows[0],cookie:result.cookie};}
try {
 const main=await signup('main'),foreign=await signup('foreign');
 await ok(main.cookie,'src/app/(app)/products/actions:saveProduct',[form({code:'SYN-P',name:'Synthetic Product',price:'1',currency:'GBP',kind:'PRODUCT',unit:'each',taxCategory:'STANDARD'})]);
 const product=(await client.query('SELECT id FROM products WHERE "organisationId"=$1 AND code=$2',[main.org,'SYN-P'])).rows[0].id;
 for(const code of ['A','B'])await ok(main.cookie,'src/app/(app)/stock/actions:createWarehouse',[form({name:`Synthetic ${code}`,code})]);
 await ok(foreign.cookie,'src/app/(app)/stock/actions:createWarehouse',[form({name:'Foreign synthetic warehouse',code:'F'})]);
 const warehouses=(await client.query('SELECT id,code FROM warehouses WHERE "organisationId"=$1',[main.org])).rows;
 const a=warehouses.find(w=>w.code==='A').id,b=warehouses.find(w=>w.code==='B').id;
 const foreignWarehouse=(await client.query('SELECT id FROM warehouses WHERE "organisationId"=$1',[foreign.org])).rows[0].id;
 await ok(main.cookie,'src/app/(app)/stock/actions:adjustStock',[form({productId:product,warehouseId:a,delta:'100',reason:'Synthetic receipt',reference:'SYN-R',requestKey:crypto.randomUUID()})]);
 const transfer=form({productId:product,fromWarehouseId:a,toWarehouseId:b,quantity:'30',reason:'Synthetic transfer',reference:'SYN-T',requestKey:crypto.randomUUID()});
 await ok(main.cookie,'src/app/(app)/stock/actions:transferStock',[transfer]);await ok(main.cookie,'src/app/(app)/stock/actions:transferStock',[transfer]);
 assert.equal(Number((await client.query('SELECT count(*) FROM inventory_movements WHERE "organisationId"=$1',[main.org])).rows[0].count),3);
 const concurrent=await Promise.all([1,2].map(()=>action(main.cookie,'src/app/(app)/stock/actions:transferStock',[form({productId:product,fromWarehouseId:a,toWarehouseId:b,quantity:'40',reason:'Concurrent synthetic transfer',reference:'SYN-C',requestKey:crypto.randomUUID()})])));
 assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,400]);
 const stock=(await client.query('SELECT quantity FROM inventory_balances WHERE "organisationId"=$1 ORDER BY quantity',[main.org])).rows.map(r=>r.quantity);assert.deepEqual(stock,[30,70]);
 const blocked=await action(main.cookie,'src/app/(app)/stock/actions:transferStock',[form({productId:product,fromWarehouseId:a,toWarehouseId:foreignWarehouse,quantity:'1',reason:'Must reject',reference:'',requestKey:crypto.randomUUID()})]);assert.equal(blocked.status,400);
 const key=crypto.randomUUID();const newPlan=form({name:'Synthetic annual plan',startsOn:'2027-01-01',endsOn:'2027-12-31',bucket:'MONTH',requestKey:key});
 await ok(main.cookie,'src/modules/planning/services/plans:createProductionPlan',[newPlan]);await ok(main.cookie,'src/modules/planning/services/plans:createProductionPlan',[newPlan]);
 const plans=await ok(main.cookie,'src/modules/planning/services/plans:listProductionPlans',[]);assert.equal(plans.length,1);assert.equal(plans[0].endsOn,'2027-12-31');
 await ok(main.cookie,'src/core/teams/actions:createWorkTeam',[form({name:'Synthetic Team',code:'SYN-TEAM',membershipId:main.membership})]);
 const team=(await client.query('SELECT id FROM work_teams WHERE "organisationId"=$1',[main.org])).rows[0].id;
 const line=form({planId:plans[0].id,productId:product,startsOn:'2027-01-01',endsOn:'2027-01-07',bucket:'MONTH',quantity:'12.340000',version:'1',teamId:team,assignedMembershipId:main.membership,notes:'=Synthetic formula test',requestKey:crypto.randomUUID()});
 await ok(main.cookie,'src/modules/planning/services/plans:addProductionPlanLine',[line]);await ok(main.cookie,'src/modules/planning/services/plans:addProductionPlanLine',[line]);
 const plan=await ok(main.cookie,'src/modules/planning/services/plans:getProductionPlan',[plans[0].id]);assert.equal(plan.lines.length,1);assert.equal(plan.lines[0].quantity,'12.34');assert.equal(plan.lines[0].teamName,'Synthetic Team');assert.equal(plan.version,2);
 assert.equal((await ok(foreign.cookie,'src/modules/planning/services/plans:listProductionPlans',[])).length,0);
 assert.equal(await ok(foreign.cookie,'src/modules/planning/services/plans:getProductionPlan',[plan.id]),null);
 assert.equal((await action(null,'src/modules/planning/services/queries:getPlanningCoverage',[])).status,401);
 const csv=await ok(main.cookie,'src/modules/stock/services/export:inventoryExportRows',['stock','','','']);assert.equal(csv.length,3);
 console.log('PASS: central signup/session, receipt, atomic transfers, concurrent stock protection, retry idempotency, foreign warehouse rejection, annual plan, decimal target, team/person assignment, plan replay, foreign-plan isolation, unauthenticated rejection and stock export rows.');
} finally {
 for(const email of identities){const {rows}=await client.query('SELECT m."organisationId" AS org,u.id AS userid FROM users u LEFT JOIN memberships m ON m."userId"=u.id WHERE u.email=$1',[email]);for(const row of rows){if(row.org){await client.query('DELETE FROM roles_on_memberships WHERE "membershipId" IN (SELECT id FROM memberships WHERE "organisationId"=$1)',[row.org]);await client.query('DELETE FROM roles WHERE "organisationId"=$1',[row.org]);await client.query('DELETE FROM organisations WHERE id=$1',[row.org]);}await client.query('DELETE FROM users WHERE id=$1',[row.userid]);}}
 await client.end();console.log('Synthetic fixtures cleaned from the central test database.');
}
