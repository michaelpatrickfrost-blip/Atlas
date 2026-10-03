// Operator-only bootstrap; not a web action or tenant role capability.
import 'dotenv/config';
import pg from 'pg';
const email=process.env.ATLAS_OWNER_EMAIL;
if(!email)throw new Error('Specify the existing Atlas owner account email');
const client=new pg.Client({connectionString:process.env.DATABASE_URL});await client.connect();
try{const user=await client.query('SELECT id FROM users WHERE email=$1',[email.toLowerCase()]);if(user.rows.length!==1)throw new Error('Owner account must already exist');await client.query('INSERT INTO platform_administrators ("userId") VALUES ($1) ON CONFLICT DO NOTHING',[user.rows[0].id]);console.log('Granted owner console access to the specified existing account');}finally{await client.end();}
