import {Decimal} from '@prisma/client/runtime/client';
// Transport structured values without losing Dates, BigInts or FormData inputs.
export type Wire=string|number|boolean|null|Wire[]|{[key:string]:Wire};
export async function encodeWire(value:unknown):Promise<Wire>{
 if(value===undefined)return {__atlas:'undefined'};if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number')return value;
 if(Decimal.isDecimal(value))return {__atlas:'decimal',value:String(value)};
 if(value instanceof Date)return {__atlas:'date',value:value.toISOString()};if(typeof value==='bigint')return {__atlas:'bigint',value:value.toString()};
 if(value instanceof FormData){const entries:Wire[]=[];for(const [key,item]of value.entries())entries.push([key,typeof item==='string'?item:{__atlas:'file',name:item.name,type:item.type,value:Buffer.from(await item.arrayBuffer()).toString('base64')}]);return {__atlas:'form',entries};}
 if(Array.isArray(value))return Promise.all(value.map(encodeWire));
 if(typeof value==='object')return Object.fromEntries(await Promise.all(Object.entries(value).map(async([key,item])=>[key,await encodeWire(item)])));
 throw new Error('Unsupported data API value.');
}
export function decodeWire(value:Wire):unknown{if(value===null||typeof value!=='object')return value;if(Array.isArray(value))return value.map(decodeWire);if(value.__atlas==='undefined')return undefined;if(value.__atlas==='date')return new Date(String(value.value));if(value.__atlas==='decimal')return String(value.value);if(value.__atlas==='bigint')return BigInt(String(value.value));if(value.__atlas==='form'){const form=new FormData();for(const pair of value.entries as Wire[][]){const item=pair[1];if(item&&typeof item==='object'&&!Array.isArray(item)&&item.__atlas==='file')form.append(String(pair[0]),new File([Buffer.from(String(item.value),'base64')],String(item.name),{type:String(item.type)}));else form.append(String(pair[0]),String(item));}return form;}return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,decodeWire(item)]));}
