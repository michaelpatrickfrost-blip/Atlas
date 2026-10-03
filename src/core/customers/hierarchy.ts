export type HierarchyAccount={id:string;parentPartyId:string|null};
/** The complete connected ownership tree; protects traversal against legacy cycles. */
export function hierarchyAccountIds(accounts:HierarchyAccount[],accountId:string):string[]{
 const byId=new Map(accounts.map(a=>[a.id,a]));if(!byId.has(accountId))return [];
 let root=accountId;const ancestors=new Set<string>();
 while(byId.get(root)?.parentPartyId&&byId.has(byId.get(root)!.parentPartyId!)){if(ancestors.has(root))break;ancestors.add(root);root=byId.get(root)!.parentPartyId!;}
 const result=new Set<string>(),pending=[root];while(pending.length){const id=pending.pop()!;if(result.has(id))continue;result.add(id);for(const a of accounts)if(a.parentPartyId===id)pending.push(a.id);}
 return [...result];
}
export function descendantAccountIds(accounts:HierarchyAccount[],roots:string[]):string[]{
 const result=new Set<string>(),pending=[...roots];while(pending.length){const id=pending.pop()!;if(result.has(id))continue;result.add(id);for(const a of accounts)if(a.parentPartyId===id)pending.push(a.id);}return [...result];
}
