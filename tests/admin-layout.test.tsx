import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const state=vi.hoisted(()=>({session:null as Session|null}));
vi.mock("@/core/auth/session",()=>({getSession:async()=>state.session}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error(`REDIRECT:${url}`);}}));
vi.mock("@/components/admin/shell",()=>({AdminShell:()=>null}));
import AdminLayout from "@/app/(admin)/atlas/layout";
beforeEach(()=>{state.session=null;});
it("redirects signed-out Admin visitors to the staff login",async()=>{
 await expect(AdminLayout({children:"content"})).rejects.toThrow("REDIRECT:/atlas/login");
});
it("rejects customer sessions before rendering the Admin console",async()=>{
 state.session={userId:"customer",userName:"Customer",userEmail:"customer@example.test",organisationId:"a",organisationName:"A",membershipId:"m",capabilities:new Set(["studio.definition.read"])};
 await expect(AdminLayout({children:"content"})).rejects.toThrow("REDIRECT:/home");
});
it("uses the standalone Admin shell for independently authorised staff",async()=>{
 state.session={userId:"staff",userName:"Staff",userEmail:"staff@example.test",organisationId:"internal",organisationName:"Atlas",membershipId:"m",capabilities:new Set(["atlas.companies.manage"])};
 const result=await AdminLayout({children:"content"});expect(result.props.session).toBe(state.session);expect(result.props.children).toBe("content");
});
