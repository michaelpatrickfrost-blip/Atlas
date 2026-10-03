import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const dir='/var/backups/atlas-test';
fs.mkdirSync(dir,{recursive:true,mode:0o700});
const stamp=new Date().toISOString().replaceAll(':','-');
const file=`${dir}/atlas-${stamp}.json`;
execFileSync(process.execPath,['scripts/transfer-test-data.mjs','export',file+'.partial'],{stdio:'inherit'});
fs.renameSync(file+'.partial',file);
// Keep the 14 latest completed daily snapshots; deployment/migration snapshots are separate.
const files=fs.readdirSync(dir).filter(n=>/^atlas-.*\.json$/.test(n)).sort();
for(const name of files.slice(0,-14))fs.unlinkSync(`${dir}/${name}`);
console.log('Atlas backup complete');
