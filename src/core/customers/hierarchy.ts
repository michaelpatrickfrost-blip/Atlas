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

const ROLE_RANK:Record<string,number>={GROUP:0,CUSTOMER:1,BRANCH:2,DELIVERY:3};

/** Siblings in the same order the map draws them: group, business, branch, then name. */
export function orderedSiblings<T extends HierarchyAccount&{name:string;hierarchyRole?:string}>(accounts:T[],parentPartyId:string|null):T[]{
 return accounts.filter(account=>(account.parentPartyId??null)===parentPartyId).sort((a,b)=>(ROLE_RANK[a.hierarchyRole??"CUSTOMER"]??1)-(ROLE_RANK[b.hierarchyRole??"CUSTOMER"]??1)||a.name.localeCompare(b.name));
}

/**
 * Up lifts an account to its grandparent (or makes it independent).
 * Down nests it under the sibling drawn above it. Undefined means that move is not available.
 * Null is a real parent: an independent account.
 */
export function nextHierarchyParent<T extends HierarchyAccount&{name:string;hierarchyRole?:string}>(accounts:T[],accountId:string,direction:"up"|"down"):string|null|undefined{
 const account=accounts.find(item=>item.id===accountId);
 if(!account)return undefined;
 if(direction==="up"){
  if(!account.parentPartyId)return undefined;
  const parent=accounts.find(item=>item.id===account.parentPartyId);
  return parent?.parentPartyId??null;
 }
 const siblings=orderedSiblings(accounts,account.parentPartyId??null);
 const index=siblings.findIndex(item=>item.id===accountId);
 const above=index>0?siblings[index-1]:undefined;
 return above?.id;
}

export function reportingDescendantIds(people:{id:string;reportsToContactId:string|null}[],contactId:string):string[]{
 return descendantAccountIds(people.map(person=>({id:person.id,parentPartyId:person.reportsToContactId})),[contactId]);
}

/** True when pointing this person at that manager would loop back to them. */
export function reportsInCircle(people:{id:string;reportsToContactId:string|null}[],contactId:string,managerId:string):boolean{
 const parent=new Map(people.map(person=>[person.id,person.reportsToContactId]));
 parent.set(contactId,managerId);
 const seen=new Set<string>();
 let next:string|null=managerId;
 while(next){
  if(next===contactId||seen.has(next))return true;
  seen.add(next);
  next=parent.get(next)??null;
 }
 return false;
}
