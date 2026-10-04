import {createHash,randomBytes} from 'node:crypto';
export const RECOVERY_MINUTES=30;
export function createRecoveryCredential(){const code=randomBytes(32).toString('hex');return {code,tokenHash:hashRecoveryCode(code),expiresAt:new Date(Date.now()+RECOVERY_MINUTES*60_000)};}
export function hashRecoveryCode(code:string){return createHash('sha256').update(code).digest('hex');}
export function validNewPassword(password:string){return password.length>=12&&password.length<=128&&Buffer.byteLength(password,'utf8')<=72;}
