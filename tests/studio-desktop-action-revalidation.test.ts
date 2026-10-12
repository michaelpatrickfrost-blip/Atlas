import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { desktopActionRevalidation } from '../scripts/desktop-action-revalidation.mjs';

const classify = (source: string) => desktopActionRevalidation(ts.createSourceFile('actions.ts', source, ts.ScriptTarget.Latest, true));
const cache = `import {revalidatePath} from 'next/cache';`;
describe('original desktop action refresh classification', () => {
  it('preserves direct and inline callback refresh, including an imported alias', () => {
    const result = classify(`${cache} import {revalidatePath as invalidate} from 'next/cache';
      export async function direct(){ revalidatePath('/tickets'); }
      export async function callback(){ await work(async()=>{revalidatePath('/tickets');}); }
      export async function alias(){ invalidate('/', 'layout'); }`);
    for (const name of ['direct', 'callback', 'alias']) expect(result.get(name)).toBe(true);
  });
  it('follows only same-file top-level function and const arrow/function direct calls', () => {
    const result = classify(`${cache}
      const refresh = () => revalidatePath('/', 'layout');
      const middle = function(){ refresh(); };
      function outer(){ middle(); }
      export async function save(){ await write(); outer(); }
      export async function inspect(){ return read(); }`);
    expect(result.get('save')).toBe(true); expect(result.get('inspect')).toBe(false);
  });
  it('terminates recursive helper chains while retaining a reachable refresh', () => {
    const result = classify(`${cache}
      function a(){ b(); } function b(){ a(); revalidatePath('/'); }
      function cycle(){ cycle(); } export async function save(){ a(); }
      export async function inspect(){ cycle(); }`);
    expect(result.get('save')).toBe(true); expect(result.get('inspect')).toBe(false);
  });
  it('does not mistake parameters, block locals or an unrelated import for shared refresh', () => {
    const result = classify(`${cache} import {external} from './helpers';
      const refresh = () => revalidatePath('/');
      export async function parameter(refresh:()=>void){ refresh(); }
      export async function block(){ const refresh=()=>{}; refresh(); }
      export async function shadow(revalidatePath:()=>void){ revalidatePath(); }
      export async function imported(){ external(); }`);
    for (const name of ['parameter', 'block', 'shadow', 'imported']) expect(result.get(name)).toBe(false);
  });
  it('does not broaden to dynamic/member/mutable helpers, text, type imports or uncalled declarations', () => {
    const result = classify(`${cache} import type {revalidatePath as typeOnly} from 'next/cache';
      let mutable=()=>revalidatePath('/'); const obj={refresh:()=>revalidatePath('/')};
      export async function text(){ const x='revalidatePath('; /* revalidatePath('/') */ }
      export async function member(){ obj.refresh(); }
      export async function dynamic(){ mutable(); typeOnly('/'); }
      export async function unused(){ function later(){ revalidatePath('/'); } const local=()=>revalidatePath('/'); }
      export async function evalCall(){ eval('revalidatePath("/")'); }`);
    for (const name of ['text', 'member', 'dynamic', 'unused', 'evalCall']) expect(result.get(name)).toBe(false);
  });
  it.each([
    ['src/app/(studio)/design-studio/actions.ts', ['createVisualScreen', 'saveVisualScreen', 'publishVisualScreen', 'restoreVisualScreen'], ['inspectVisualScreen', 'previewVisualScreen', 'compareVisualScreen']],
    ['src/app/(studio)/design-studio/setup/actions.ts', ['saveBusinessSetup', 'reviewBusinessSetup', 'goLiveBusinessSetup', 'restoreBusinessSetup'], ['readFieldChangeStatus', 'readFieldChangeRecovery']],
    ['src/app/(studio)/design-studio/dashboards/actions.ts', ['createBusinessDashboard', 'saveBusinessDashboard', 'publishBusinessDashboard', 'restoreBusinessDashboard'], ['loadBusinessDashboardMetrics', 'loadBusinessDashboardSlice']],
  ])('classifies the actual Studio source %s without executing actions', (path, refreshing, reading) => {
    const source = readFileSync(path, 'utf8'), result = classify(source);
    for (const name of refreshing) expect(result.get(name), name).toBe(true);
    for (const name of reading) expect(result.get(name), name).toBe(false);
  });
  it('connects classification only to the original remote forwarding flag', () => {
    const preparation = readFileSync('scripts/prepare-runtime.mjs', 'utf8');
    expect(preparation).toContain('revalidation=desktopActionRevalidation(ast)');
    expect(preparation).toContain('const shouldRevalidate=revalidation.get(node.name.text)===true;');
    expect(preparation).toContain('atlasRemoteAction(${JSON.stringify(action.key)},[${args}],${shouldRevalidate})');
    expect(preparation).toContain("fs.rmSync(path.join(stage,'src/app/api/desktop'),{recursive:true,force:true});");
  });
});
