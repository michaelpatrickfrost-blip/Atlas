import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const lookup=vi.hoisted(()=>vi.fn());
vi.mock("@/core/db/client",()=>({db:{organisation:{findFirst:lookup}}}));
import { adminStudioContext, studioActionContext } from "@/core/studio/definitions/admin";
const s:Session={organisationId:"own",organisationName:"Own",membershipId:"m",userId:"u",userEmail:"u@example.invalid",userName:"U",capabilities:new Set(["studio.definition.edit"])};
beforeEach(()=>vi.clearAllMocks());
it("rejects a customer-selected target even with Studio edit permission",async()=>{
 await expect(studioActionContext(s,"foreign")).rejects.toThrow("FORBIDDEN");expect(lookup).not.toHaveBeenCalled();
 expect(await studioActionContext(s)).toBe(s);
});
it("keeps independent staff identity while validating the target company on the server",async()=>{
 const staff={...s,capabilities:new Set([...s.capabilities,"atlas.staff.manage","atlas.companies.manage"])};
 lookup.mockResolvedValue({id:"target",name:"Target"});
 const context=await adminStudioContext(staff,"target");
 expect(context.userId).toBe(s.userId);expect(context.capabilities).toBe(staff.capabilities);expect(context.organisationId).toBe("target");
 expect(lookup.mock.calls[0][0].where).toMatchObject({id:"target",kind:"CUSTOMER",status:"ACTIVE",archivedAt:null});
 lookup.mockResolvedValue(null);await expect(adminStudioContext(staff,"archived")).rejects.toThrow("unavailable");
});
