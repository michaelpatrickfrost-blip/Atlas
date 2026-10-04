import {describe,it,expect} from 'vitest';
import {presetCapabilities,capabilityOverrides,effectiveRoleCapabilities} from '@/core/permissions/access-levels';
import {createRecoveryCredential,hashRecoveryCode,validNewPassword} from '@/core/auth/recovery';
describe('access presets and exceptions',()=>{
 const group={id:'sales',name:'Sales',capabilities:['sales.order.read','sales.order.create','sales.order.edit_draft','sales.order.confirm','sales.order.price_override','customers.bank.reveal']};
 it('keeps approvals and sensitive controls out of Read and Write',()=>{expect(presetCapabilities(group,'read')).toEqual(['sales.order.read']);expect(presetCapabilities(group,'write')).toEqual(['sales.order.read','sales.order.create','sales.order.edit_draft']);expect(presetCapabilities(group,'none')).toEqual([]);expect(presetCapabilities(group,'admin')).toEqual(group.capabilities);});
 it('retains denials over overlapping roles and computes only actual exceptions',()=>{const base=effectiveRoleCapabilities([{capabilities:['read','write']},{capabilities:['read','approve']}]);const selected=new Set(['read','other']);const overrides=capabilityOverrides(base,selected);expect(overrides).toEqual({grantedCapabilities:['other'],deniedCapabilities:['write','approve']});expect([...effectiveRoleCapabilities([{capabilities:[...base]}],overrides.grantedCapabilities,overrides.deniedCapabilities)]).toEqual(['read','other']);});
});
describe('recovery credentials',()=>{
 it('generates independent high-entropy codes, stores only their hash and expires',()=>{const a=createRecoveryCredential(),b=createRecoveryCredential();expect(a.code).toMatch(/^[a-f0-9]{64}$/);expect(a.code).not.toBe(b.code);expect(a.tokenHash).toBe(hashRecoveryCode(a.code));expect(a.tokenHash).not.toBe(a.code);expect(a.expiresAt.getTime()-Date.now()).toBeGreaterThan(29*60_000);});
 it('rejects short passwords and bcrypt byte truncation',()=>{expect(validNewPassword('tiny')).toBe(false);expect(validNewPassword('a secure passphrase')).toBe(true);expect(validNewPassword('🔐'.repeat(20))).toBe(false);});
});
