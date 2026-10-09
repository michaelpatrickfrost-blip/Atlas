import { expect, it } from "vitest";
import { withAdminActionAliases } from "@/server/data-api/action-aliases";
it("keeps installed desktop operation keys and new Admin callers bound to the same guarded action",()=>{
 const action=()=>"guarded", other=()=>"other";
 const result=withAdminActionAliases({"src/app/(admin)/atlas/admin-actions:openCompanyWorkspace":action,"src/app/(app)/sales/actions:create":other});
 expect(result["src/app/(app)/atlas/admin-actions:openCompanyWorkspace"]).toBe(action);
 expect(result["src/app/(admin)/atlas/admin-actions:openCompanyWorkspace"]).toBe(action);
 expect(Object.keys(result)).toHaveLength(3);
});
it("rejects conflicting aliases rather than overriding a guarded operation",()=>{
 expect(()=>withAdminActionAliases({"src/app/(app)/atlas/actions:create":():number=>1,"src/app/(admin)/atlas/actions:create":():number=>2})).toThrow("Conflicting Admin action alias");
});
