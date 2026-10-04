import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
execFileSync(process.execPath,['scripts/prepare-runtime.mjs','data-service'],{stdio:'inherit'});
execFileSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:path.join(root,'build/data-service-source'),stdio:'inherit',env:{...process.env,ATLAS_RUNTIME:'data-service'}});
