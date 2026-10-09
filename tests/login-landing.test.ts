import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ path:"/login", findUnique: vi.fn(), update: vi.fn(), limit: vi.fn(), compare: vi.fn(), cookie: vi.fn(), clear: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock("@/core/db/client", () => ({ db: { user: { findUnique: mocks.findUnique }, membership: { update: mocks.update } } }));
vi.mock("bcryptjs", () => ({ default: { compare: mocks.compare } }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/core/auth/session", () => ({ createSessionCookie: mocks.cookie, clearSessionCookie: mocks.clear }));
vi.mock("@/core/admin/access", () => ({ platformCapabilities: (admin: unknown) => admin ? ["atlas.companies.manage"] : [] }));
vi.mock("next/headers",()=>({headers:async()=>new Headers({"x-atlas-request-path":mocks.path})}));
vi.mock("@/core/auth/attempt-limit",()=>({allowAuthenticationAttempt:mocks.limit,AUTH_LIMIT_ERROR:"Too many attempts. Wait 15 minutes before trying again."}));
import { loginAction, logoutAdminAction } from "@/core/auth/actions";
const form = new FormData(); form.set("email", "user@example.test"); form.set("password", "test-only");
beforeEach(() => { vi.clearAllMocks(); mocks.path="/login"; mocks.compare.mockResolvedValue(true); mocks.limit.mockResolvedValue(true); });
describe("sign-in landing", () => {
  for (const staff of [false, true]) it(`lands ${staff ? "Atlas staff" : "company users"} in their own login area`, async () => {
    mocks.findUnique.mockResolvedValue({ id: "user", passwordHash: "hash", platformAdmin: staff ? {} : null, memberships: [{ id: "member", organisationId: "company", active: true, organisation: { status: "ACTIVE", kind: staff ? "INTERNAL" : "CUSTOMER" } }] });
    const credentials = new FormData(); credentials.set("email", "user@example.test"); credentials.set("password", "test-only");
    if (staff) { mocks.path = "/19811171adminlogin"; credentials.set("portal", "atlas"); }
    await expect(loginAction(credentials)).rejects.toThrow(staff ? "REDIRECT:/atlas" : "REDIRECT:/home");
    expect(mocks.cookie).toHaveBeenCalledWith({ userId: "user", organisationId: "company" });
  });
  it("does not establish a session or navigate on a rejected password", async () => {
    mocks.findUnique.mockResolvedValue({ passwordHash: "hash" }); mocks.compare.mockResolvedValue(false);
    expect(await loginAction(form)).toEqual({ error: "Incorrect email or password." });
    expect(mocks.cookie).not.toHaveBeenCalled(); expect(mocks.redirect).not.toHaveBeenCalled();
  });
});


describe("company-specific sign-in", () => {
  const member=(slug:string,id=slug)=>({id,organisationId:id,active:true,organisation:{slug,kind:"CUSTOMER",status:"ACTIVE"}});
  const scoped=(slug:string,portal?:string)=>{mocks.path=portal==="atlas"?"/19811171adminlogin":`/business/${slug}/login`;const f=new FormData();f.set("email","user@example.test");f.set("password","test-only");f.set("companySlug",slug);if(portal)f.set("portal",portal);return f;};
  it("pins a multi-company identity to the URL's business",async()=>{
    mocks.findUnique.mockResolvedValue({id:"user",passwordHash:"hash",platformAdmin:null,memberships:[member("first"),member("second")]});
    await expect(loginAction(scoped("second"))).rejects.toThrow("REDIRECT:/home");
    expect(mocks.cookie).toHaveBeenCalledWith({userId:"user",organisationId:"second"});
  });
  it("rejects a different business and ambiguous legacy login without issuing a cookie",async()=>{
    mocks.findUnique.mockResolvedValue({id:"user",passwordHash:"hash",platformAdmin:null,memberships:[member("first"),member("second")]});
    expect(await loginAction(scoped("third"))).toHaveProperty("error");
    mocks.path="/login";expect(await loginAction(form)).toHaveProperty("error");
    expect(mocks.cookie).not.toHaveBeenCalled();
  });
  it("cannot gain Atlas Admin access by submitting its portal flag",async()=>{
    mocks.findUnique.mockResolvedValue({id:"user",passwordHash:"hash",platformAdmin:null,memberships:[member("first")]});
    expect(await loginAction(scoped("","atlas"))).toHaveProperty("error");expect(mocks.cookie).not.toHaveBeenCalled();
  });
  it("blocks suspended memberships and companies",async()=>{
    const inactive=member("first");inactive.active=false;
    mocks.findUnique.mockResolvedValue({id:"user",passwordHash:"hash",platformAdmin:null,memberships:[inactive]});
    expect(await loginAction(scoped("first"))).toHaveProperty("error");expect(mocks.cookie).not.toHaveBeenCalled();
  });
});

it("rejects a forged hidden company selector despite an eligible membership",async()=>{
 mocks.path="/business/first/login";
 mocks.findUnique.mockResolvedValue({id:"user",passwordHash:"hash",platformAdmin:null,memberships:[{id:"second",organisationId:"second",active:true,organisation:{slug:"second",kind:"CUSTOMER",status:"ACTIVE"}}]});
 const forged=new FormData();
 forged.set("email","user@example.test");forged.set("password","test-only");
 forged.set("companySlug","second");
 expect(await loginAction(forged)).toHaveProperty("error");expect(mocks.cookie).not.toHaveBeenCalled();
});

it("signs out the Admin session back to its own staff login",async()=>{
 await expect(logoutAdminAction()).rejects.toThrow("REDIRECT:/19811171adminlogin");
 expect(mocks.clear).toHaveBeenCalledOnce();
});

it("rejects staff at the generic customer login even with a correct password", async () => {
 mocks.findUnique.mockResolvedValue({id:"staff",passwordHash:"hash",platformAdmin:{},memberships:[{id:"m",organisationId:"internal",active:true,organisation:{kind:"INTERNAL",status:"ACTIVE"}}]});
 expect(await loginAction(form)).toEqual({error:"Use the sign-in address provided for your account."});
 expect(mocks.cookie).not.toHaveBeenCalled();expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects throttled attempts before looking up an account or comparing a password",async()=>{
 mocks.limit.mockResolvedValue(false);
 expect(await loginAction(form)).toHaveProperty("error", "Too many attempts. Wait 15 minutes before trying again.");
 expect(mocks.findUnique).not.toHaveBeenCalled();expect(mocks.compare).not.toHaveBeenCalled();expect(mocks.cookie).not.toHaveBeenCalled();
});
it("fails closed when the shared attempt limiter is unavailable",async()=>{
 mocks.limit.mockRejectedValue(new Error("database unavailable"));
 expect(await loginAction(form)).toHaveProperty("error", "Sign-in is temporarily unavailable. Try again shortly.");
 expect(mocks.findUnique).not.toHaveBeenCalled();expect(mocks.cookie).not.toHaveBeenCalled();
});
it("runs bcrypt for an unknown account without creating a session",async()=>{
 mocks.findUnique.mockResolvedValue(null);
 expect(await loginAction(form)).toHaveProperty("error","Incorrect email or password.");
 expect(mocks.compare).toHaveBeenCalledOnce();expect(mocks.cookie).not.toHaveBeenCalled();
});
