import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=process.cwd(),schema=fs.readFileSync('prisma/schema.prisma','utf8'),blocks=[...schema.matchAll(/model (\w+) \{([\s\S]*?)\n\}/g)],names=new Set(blocks.map(m=>m[1])),models={};
for(const [,name,body]of blocks){const fields={};for(const line of body.split('\n')){const match=line.match(/^\s*(\w+)\s+(\w+)(\[\]|\?)?/);if(!match)continue;const [,key,type,suffix]=match;fields[key]={type,list:suffix==='[]',nullable:suffix==='?',relation:names.has(type)};}models[name]=fields;}
fs.writeFileSync('src/server/data-api/model-metadata.ts','// Generated from the application schema.\nexport const MODEL_FIELDS = '+JSON.stringify(models,null,2)+' as const;\n');
const actions=[];
function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()&&entry.name!=='generated')visit(file);else if(entry.isFile()&&file.endsWith('.ts')){const text=fs.readFileSync(file,'utf8');if(!/^\s*["']use server["'];/m.test(text))continue;const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);for(const node of source.statements)if(ts.isFunctionDeclaration(node)&&node.name&&node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)){actions.push({file,name:node.name.text,key:file.replace(/\.ts$/,'')+':'+node.name.text});}}}}
visit('src');
fs.writeFileSync('src/server/data-api/action-registry.ts','// Generated allowlist: public calls still enforce their own server capabilities.\n'+actions.map((a,i)=>`import {${a.name} as action${i}} from ${JSON.stringify('@/'+a.file.slice(4,-3))};`).join('\n')+'\nexport const DATA_ACTIONS:Record<string,(...args:never[])=>Promise<unknown>>={\n'+actions.map((a,i)=>`${JSON.stringify(a.key)}:action${i} as (...args:never[])=>Promise<unknown>`).join(',\n')+'\n};\n');
fs.mkdirSync('build',{recursive:true});fs.writeFileSync('build/data-actions.json',JSON.stringify(actions));console.log(`Data API: ${blocks.length} model descriptors, ${actions.length} allowlisted actions.`);
