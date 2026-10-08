import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ companies: [] as {id:string;name:string;kind:string;isTest:boolean;updatedAt:Date}[], raw: vi.fn(), create: vi.fn(), deleteCompany: vi.fn(), update: vi.fn(), file: vi.fn(), transaction: vi.fn(), run: { id: "run", version: 0, status: "REMOVING_FILES", remainingFileKeys: [] as string[], removedFileCount: 0 } }));
vi.mock("@/core/service-work/files", () => ({ removeServiceFile: state.file }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: state.transaction, companyCleanupRun: { findUniqueOrThrow: async () => state.run, updateMany: state.update } } }));
import { wipeTestCompanies, finishCompanyFileCleanup } from "@/core/admin/wipe-company";
beforeEach(() => {
  vi.clearAllMocks(); state.companies = [{id:"test-a",name:"Test A",kind:"CUSTOMER",isTest:true,updatedAt:new Date("2026-10-08T10:00:00Z")}];
  state.run = {id:"run",version:0,status:"REMOVING_FILES",remainingFileKeys:[],removedFileCount:0}; state.file.mockResolvedValue(undefined);
  state.raw.mockImplementation(async (sql: string) => sql.startsWith("SELECT id,name") ? state.companies : 1);
  state.create.mockImplementation(async () => state.run);
  state.update.mockImplementation(async ({ data }) => { state.run = {...state.run,status:data.status,version:state.run.version+1,remainingFileKeys:data.remainingFileKeys,removedFileCount:state.run.removedFileCount+data.removedFileCount.increment}; return {count:1}; });
  state.transaction.mockImplementation(async callback => callback({
    $queryRawUnsafe: state.raw, $executeRawUnsafe: state.raw,
    $queryRaw: async (parts: TemplateStringsArray) => parts.join("").includes("information_schema") ? [{table:"organisations",column:"id",type:"text"},{table:"parties",column:"organisationId",type:"text"}] : [],
    membership: {findMany: async()=>[{userId:"shared-user"}]}, employee:{findMany:async()=>[]}, serviceFile:{findMany:async()=>[]},
    organisation:{deleteMany:state.deleteCompany},companyCleanupRun:{create:state.create},auditEntry:{create:vi.fn()},
  }));
});
it("refuses ordinary/internal and missing companies before deleting any records", async () => {
  for (const patch of [{isTest:false},{kind:"INTERNAL"}]) { state.companies = [{...state.companies[0],...patch}]; await expect(wipeTestCompanies(["test-a"])).rejects.toThrow("Only companies created as Test"); }
  state.companies = []; await expect(wipeTestCompanies(["test-a"])).rejects.toThrow("no longer exists");
  expect(state.deleteCompany).not.toHaveBeenCalled(); expect(state.raw.mock.calls.some(([sql]) => String(sql).startsWith("DELETE"))).toBe(false);
});
it("refuses current workspace and stale company details", async () => {
  const options = {actorUserId:"staff",currentOrganisationId:"test-a",selection:[{id:"test-a",name:"Test A",updatedAt:"2026-10-08T10:00:00.000Z"}]};
  await expect(wipeTestCompanies(["test-a"],options)).rejects.toThrow("Switch out");
  await expect(wipeTestCompanies(["test-a"],{...options,currentOrganisationId:"internal",selection:[{...options.selection[0],name:"Old name"}]})).rejects.toThrow("list changed");
  expect(state.deleteCompany).not.toHaveBeenCalled();
});
it("uses scoped deletes and keeps global staff/shared identities protected", async () => {
  await wipeTestCompanies(["test-a"]);
  expect(state.raw).toHaveBeenCalledWith('DELETE FROM public."parties" r WHERE r."organisationId" = ANY($1::text[])',["test-a"]);
  expect(state.raw.mock.calls.find(([sql]) => String(sql).startsWith("DELETE FROM users"))?.[0]).toContain("platform_administrators");
  expect(state.raw.mock.calls.find(([sql]) => String(sql).startsWith("DELETE FROM users"))?.[0]).toContain("NOT EXISTS (SELECT 1 FROM memberships");
  expect(state.deleteCompany).toHaveBeenCalledWith({where:{id:{in:["test-a"]},kind:"CUSTOMER",isTest:true}});
});
it("aborts the transaction on non-FK failure without starting file deletion", async () => {
  state.raw.mockImplementation(async (sql:string) => { if(sql.startsWith("SELECT id,name"))return state.companies;if(sql.startsWith("DELETE FROM public"))throw new Error("storage failure");return 1; });
  await expect(wipeTestCompanies(["test-a"])).rejects.toThrow("storage failure");
  expect(state.create).not.toHaveBeenCalled(); expect(state.file).not.toHaveBeenCalled();
});
it.each(["23503", "23001"])("retries PostgreSQL FK and RESTRICT dependencies (%s)", async code => {
  let attempts = 0;
  state.raw.mockImplementation(async (sql:string) => {
    if (sql.startsWith("SELECT id,name")) return state.companies;
    if (sql.startsWith('DELETE FROM public."parties"') && attempts++ === 0) throw {meta:{code}};
    return 1;
  });
  // Add a dependent table so the first pass can make progress before retrying its parent.
  state.transaction.mockImplementation(async callback => callback({
    $queryRawUnsafe:state.raw,$executeRawUnsafe:state.raw,
    $queryRaw:async(parts:TemplateStringsArray)=>parts.join("").includes("information_schema")?[{table:"organisations",column:"id",type:"text"},{table:"parties",column:"organisationId",type:"text"},{table:"quotes",column:"organisationId",type:"text"}]:[],
    membership:{findMany:async()=>[]},employee:{findMany:async()=>[]},serviceFile:{findMany:async()=>[]},organisation:{deleteMany:state.deleteCompany},companyCleanupRun:{create:state.create},auditEntry:{create:vi.fn()},
  }));
  await expect(wipeTestCompanies(["test-a"])).resolves.toMatchObject({status:"COMPLETE"});
  expect(attempts).toBe(2);
});
it("records storage failures for an idempotent retry and treats missing files as removed", async () => {
  state.run.remainingFileKeys=["removed","missing","unavailable"];
  state.file.mockImplementation(async(key:string)=>{if(key==="missing")throw {code:"ENOENT"};if(key==="unavailable")throw {code:"EIO"};});
  expect(await finishCompanyFileCleanup("run")).toMatchObject({status:"FILES_PENDING",remainingFileKeys:["unavailable"],removedFileCount:2});
  expect(state.update.mock.calls[0][0].where).toEqual({id:"run",version:0});
  state.file.mockResolvedValue(undefined);state.file.mockImplementation(async()=>undefined);
  expect(await finishCompanyFileCleanup("run")).toMatchObject({status:"COMPLETE",remainingFileKeys:[],removedFileCount:3});
});
