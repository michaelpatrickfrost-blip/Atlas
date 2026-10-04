import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';

// Generated build workspaces, never a second editable project or a user-data store.
const mode=process.argv[2];
if(!['desktop','data-service'].includes(mode))throw new Error('Use desktop or data-service.');
const root=process.cwd(),stage=path.join(root,'build',`${mode}-source`);
fs.rmSync(stage,{recursive:true,force:true});fs.mkdirSync(stage,{recursive:true});
for(const name of ['src','public','package.json','package-lock.json','tsconfig.json','postcss.config.mjs','prisma','prisma7.config.ts','scripts/generate-data-api.mjs']){
 const target=path.join(stage,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.cpSync(path.join(root,name),target,{recursive:true,filter:source=>source!==path.join(root,'src/generated')&&!source.startsWith(path.join(root,'src/generated')+path.sep)});
}
fs.symlinkSync(path.join(root,'node_modules'),path.join(stage,'node_modules'),'dir');
const config=JSON.parse(fs.readFileSync(path.join(stage,'tsconfig.json'),'utf8'));
config.include=['next-env.d.ts','src/**/*.ts','src/**/*.tsx','.next/types/**/*.ts'];
fs.writeFileSync(path.join(stage,'tsconfig.json'),JSON.stringify(config,null,2));
// Generate both persistence types and the read allowlist from this exact snapshot.
execFileSync(process.execPath,[path.join(root,'node_modules/prisma/build/index.js'),'generate','--config','prisma7.config.ts'],{cwd:stage,stdio:'inherit'});
execFileSync(process.execPath,['scripts/generate-data-api.mjs'],{cwd:stage,stdio:'inherit'});

if(mode==='desktop'){
 const actions=JSON.parse(fs.readFileSync(path.join(stage,'build/data-actions.json'),'utf8'));
 const grouped=new Map();for(const action of actions){if(!grouped.has(action.file))grouped.set(action.file,[]);grouped.get(action.file).push(action);}
 for(const [file,entries]of grouped){
  const filename=path.join(stage,file),source=fs.readFileSync(filename,'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true),edits=[];
  for(const node of ast.statements){
   if(!ts.isFunctionDeclaration(node)||!node.name||!node.body)continue;
   const action=entries.find(a=>a.name===node.name.text);if(!action)continue;
   // Retain original types/inferred return types, but forward before any mutation.
   if(node.parameters.some(p=>!ts.isIdentifier(p.name)))throw new Error(`Unsupported action parameter: ${action.key}`);
   const shouldRevalidate=/\brevalidatePath\s*\(/.test(node.body.getText(ast));
   const args=node.parameters.map(p=>`${p.dotDotDotToken?'...':''}${p.name.text}`).join(',');
   edits.push({at:node.body.getStart(ast)+1,text:`\nif(process.env.ATLAS_RUNTIME==='desktop')return await atlasRemoteAction(${JSON.stringify(action.key)},[${args}],${shouldRevalidate}) as never;\n`});
  }
  let result=source;for(const edit of edits.sort((a,b)=>b.at-a.at))result=result.slice(0,edit.at)+edit.text+result.slice(edit.at);
  fs.writeFileSync(filename,result.replace(/(["']use server["'];)/,`$1\nimport {callRemoteAction as atlasRemoteAction} from '@/core/desktop/data-client';`));
 }
 // Desktop cannot expose the server's generic read/write gateway locally.
 fs.rmSync(path.join(stage,'src/app/api/desktop'),{recursive:true,force:true});
}else{
 // Remove ALL UI entry points. Keep action/service sources for secured persistence.
 function strip(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())strip(f);else if(/^(page|layout|template|loading|error|global-error|not-found|default)\.[cm]?[jt]sx?$/.test(e.name))fs.rmSync(f);}}
 strip(path.join(stage,'src/app'));
 function removeUI(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())removeUI(f);else if(e.name.endsWith('.tsx'))fs.rmSync(f);}}
 removeUI(path.join(stage,'src'));
 const api=path.join(stage,'src/app/api');
 for(const e of fs.readdirSync(api))if(e!=='desktop'&&e!=='sales')fs.rmSync(path.join(api,e),{recursive:true,force:true});
 for(const e of fs.readdirSync(path.join(api,'sales')))if(e!=='draft')fs.rmSync(path.join(api,'sales',e),{recursive:true,force:true});
 fs.rmSync(path.join(stage,'public'),{recursive:true,force:true});
 fs.writeFileSync(path.join(stage,'src/app/route.ts'),"export function GET(){return Response.json({service:'Atlas data service'},{headers:{'Cache-Control':'no-store'}});}\n");
}
fs.writeFileSync(path.join(stage,'next.config.mjs'),`export default {output:'standalone',outputFileTracingRoot:${mode==='desktop'?JSON.stringify(root):"process.cwd()"},experimental:{isrFlushToDisk:false,serverActions:{bodySizeLimit:'4mb'}}};\n`);
console.log(`Prepared ${mode}: ${stage}`);
