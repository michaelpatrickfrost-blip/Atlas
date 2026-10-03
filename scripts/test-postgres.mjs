// Isolated test-host database. Never use the development postgres/postgres credentials here.
import EmbeddedPostgres from 'embedded-postgres';
import fs from 'node:fs';
const dir = process.env.ATLAS_PG_DATA;
if (!dir || !process.env.ATLAS_PG_PASSWORD) throw new Error('Dedicated database directory and credentials required');
const pg = new EmbeddedPostgres({databaseDir:dir,user:'atlas_admin',password:process.env.ATLAS_PG_PASSWORD,port:5543,persistent:true,authMethod:'scram-sha-256',postgresFlags:['-c','listen_addresses=127.0.0.1','-c','max_connections=30','-c','shared_buffers=64MB']});
const first=!fs.existsSync(`${dir}/PG_VERSION`);
if(first) await pg.initialise();
await pg.start();
if(first) await pg.createDatabase('atlas_test');
console.log('Atlas test database ready on loopback port 5543');
const stop=async()=>{await pg.stop();process.exit(0);};
process.on('SIGTERM',stop);process.on('SIGINT',stop);
setInterval(()=>{},60000);
