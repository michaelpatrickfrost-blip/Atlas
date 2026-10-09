/** Explicit central Test acceptance; existing authorised QA identity, no new users. */
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { chromium, expect } from "@playwright/test";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import { platformCapabilities } from "../../src/core/admin/access";
import { STANDARD_ROLES } from "../../src/core/permissions/capabilities";
import { STUDIO_CAPABILITIES } from "../../src/core/studio/permissions";
import { createDraft, updateDraft, validateDraft, publishDraft, activateVersion, activeDefinition, getDefinition } from "../../src/core/studio/definitions/service";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { scanActiveStudioDependencies } from "../../src/core/studio/registry/compatibility";

async function main() {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1", "Explicit server acceptance opt-in required");
  const base = process.env.ATLAS_STUDIO_TEST_URL ?? "https://atlassystem.online";
  assert(base === "https://atlassystem.online" || /^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  assert(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
  assert(process.env.ATLAS_GUARDIAN_USER_ID && process.env.ATLAS_GUARDIAN_ORGANISATION_ID);
  const membership = await db.membership.findFirstOrThrow({ where: { userId: process.env.ATLAS_GUARDIAN_USER_ID, organisationId: process.env.ATLAS_GUARDIAN_ORGANISATION_ID, active: true }, include: { user: { include: { platformAdmin: true } } } });
  const platform = platformCapabilities(membership.user.platformAdmin);
  assert(platform.includes("atlas.staff.manage"), "Existing QA identity must already have independent staff access");
  const token = jwt.sign({ userId: membership.userId, organisationId: membership.organisationId, authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "30m" });
  const suffix = crypto.randomUUID().slice(0,8), ids: string[] = [];
  const browser = await chromium.launch({ headless: true });
  try {
    const companies = [];
    for (const label of ["a","b"]) {
      const company = await db.organisation.create({data:{name:`Studio acceptance ${label} ${suffix}`,slug:`studio-check-${label}-${suffix}`,isTest:true}});
      ids.push(company.id); companies.push(company);
      await db.moduleState.createMany({data:["studio","sales"].map(moduleId=>({organisationId:company.id,moduleId,enabled:true,entitled:true}))});
    }
    const [a,b] = companies;
    const staff = (org: typeof a): Session => ({userId:membership.userId,userName:membership.user.name,userEmail:membership.user.email,organisationId:org.id,organisationName:org.name,membershipId:membership.id,capabilities:new Set([...STANDARD_ROLES.find(role=>role.key==="admin")!.capabilities,...platform])});
    const actor=staff(a), other=staff(b);
    const registry=studioRegistry();
    const descriptor=(await registry.discover(actor)).find(d=>d.ownerModuleId==="sales" && d.kind==="query"); assert(descriptor);
    const reference={id:descriptor.id,version:descriptor.version,schemaHash:descriptor.schemaHash,contractHash:descriptor.contractHash};
    assert.deepEqual(await registry.invoke(actor,reference,{}),[],"Existing owner provider reads the isolated tenant through the adapter");
    const payload={schemaVersion:1 as const,description:"First accepted version",references:[reference]};
    const def=await createDraft(actor,{key:`acceptance.${suffix}`,name:"Acceptance lifecycle",kind:"capabilitySet",payload});
    assert.equal(await getDefinition(other,def.id),null);
    const unprivileged={...actor,capabilities:new Set([STUDIO_CAPABILITIES.read,STUDIO_CAPABILITIES.edit])};
    await assert.rejects(()=>publishDraft(unprivileged,{definitionId:def.id,revision:0,acknowledgeWarnings:false}),/FORBIDDEN/);
    await assert.rejects(()=>validateDraft(unprivileged,def.id,0),/FORBIDDEN/);
    await validateDraft(actor,def.id,0);
    const version1=await publishDraft(actor,{definitionId:def.id,revision:0,acknowledgeWarnings:true});
    assert.equal(await activeDefinition(actor,def.id),null,"Publication must not activate");
    let current=await getDefinition(actor,def.id); assert(current?.draft);
    await activateVersion(actor,{definitionId:def.id,versionId:version1.versionId,revision:current.revision});
    assert.equal((await activeDefinition(actor,def.id))?.version,1);
    await assert.rejects(()=>activateVersion(other,{definitionId:def.id,versionId:version1.versionId,revision:0}),/unavailable/);
    await updateDraft(actor,{definitionId:def.id,revision:version1.revision,payload:{...payload,description:"Second accepted version"}});
    await assert.rejects(()=>updateDraft(actor,{definitionId:def.id,revision:version1.revision,payload}),/CONFLICT/);
    current=await getDefinition(actor,def.id); assert(current?.draft);
    const version2=await publishDraft(actor,{definitionId:def.id,revision:current.draft.revision,acknowledgeWarnings:true});
    assert.equal((await activeDefinition(actor,def.id))?.version,1);
    current=await getDefinition(actor,def.id); assert(current);
    await activateVersion(actor,{definitionId:def.id,versionId:version2.versionId,revision:current.revision});
    current=await getDefinition(actor,def.id); assert(current);
    await activateVersion(actor,{definitionId:def.id,versionId:version1.versionId,revision:current.revision});
    assert.equal((await activeDefinition(actor,def.id))?.version,1);
    assert.equal(await db.studioDefinitionVersion.count({where:{definitionId:def.id,organisationId:a.id}}),2);
    await assert.rejects(()=>db.studioDefinitionVersion.update({where:{id:version1.versionId},data:{checksum:"0".repeat(64)}}),/immutable/);
    await assert.rejects(()=>db.studioDefinition.delete({where:{id:def.id}}),/historical keys/);
    await assert.rejects(()=>db.studioDefinition.update({where:{id:def.id},data:{key:"recycled"}}),/immutable/);
    await assert.rejects(()=>db.studioDependency.create({data:{organisationId:a.id,definitionId:def.id,versionId:version1.versionId,ownerModuleId:"sales",contractId:"sales.fake.read",contractVersion:1,schemaHash:"0".repeat(64),contractHash:"0".repeat(64)}}),/sealed plan/);
    await db.moduleState.update({where:{organisationId_moduleId:{organisationId:a.id,moduleId:"sales"}},data:{enabled:false}});
    await assert.rejects(()=>activeDefinition(actor,def.id),/unavailable|disabled|DEPENDENCY/);
    await db.moduleState.update({where:{organisationId_moduleId:{organisationId:a.id,moduleId:"sales"}},data:{enabled:true}});
    assert.deepEqual(await scanActiveStudioDependencies(db,registry),[]);
    assert.equal(await db.studioDefinition.count({where:{organisationId:b.id}}),0);
    assert.equal(await db.auditEntry.count({where:{organisationId:a.id,entityType:"StudioDefinition"}}),7);
    const foreign=await createDraft(other,{key:`acceptance.${suffix}`,name:"Independent tenant identity",kind:"capabilitySet",payload:{schemaVersion:1,description:"",references:[]}});
    await assert.rejects(()=>db.studioDefinition.update({where:{id:foreign.id},data:{activeVersionId:version1.versionId}}),/foreign key/i);
    const race=await createDraft(actor,{key:`race.${suffix}`,name:"Concurrent draft",kind:"capabilitySet",payload:{schemaVersion:1,description:"",references:[]}});
    const outcomes=await Promise.allSettled(["Editor one","Editor two"].map(description=>updateDraft(actor,{definitionId:race.id,revision:0,payload:{schemaVersion:1,description,references:[]}})));
    assert.equal(outcomes.filter(result=>result.status==="fulfilled").length,1);
    assert.equal((await getDefinition(actor,race.id))?.draft?.revision,1);
    await assert.rejects(()=>db.studioDefinitionVersion.delete({where:{id:version1.versionId}}),/immutable/);
    const dependency=await db.studioDependency.findFirstOrThrow({where:{versionId:version1.versionId,organisationId:a.id}});
    await assert.rejects(()=>db.studioDependency.delete({where:{id:dependency.id}}),/immutable/);
    console.log("PASS central lifecycle, no automatic activation, rollback/history, immutable SQL guards, sealed dependencies, tenant isolation, permissions, conflicts, disabled sources and transactional audit");

    const anon=await browser.newContext({baseURL:base});
    const locked=await anon.request.get("/atlas/studio",{maxRedirects:0}); assert.equal(locked.status(),307); assert.match(locked.headers().location,/\/atlas\/login/);
    for(const address of ["/atlas/login",`/business/${a.slug}/login`,`/business/${a.slug}/reset-password`]) assert.equal((await anon.request.get(address)).status(),200);
    assert.equal((await anon.request.get("/business/nonexistent-studio-check/login")).status(),404); await anon.close();
    const context=await browser.newContext({baseURL:base,viewport:{width:1440,height:1000}});
    await context.addCookies([{name:"atlas_session",value:token,url:base,secure:base.startsWith("https"),httpOnly:true,sameSite:"Lax"}]);
    const page=await context.newPage();let errors=0,assets=0;
    page.on("pageerror",()=>errors++);page.on("response",r=>{if(new URL(r.url()).pathname.startsWith("/_next/")&&r.status()>=400)assets++;});
    await page.goto(`/atlas/studio/${a.id}`,{waitUntil:"networkidle"});
    await expect(page.getByRole("heading",{name:"Configuration library",exact:true})).toBeVisible();
    await page.getByLabel("Name",{exact:true}).fill("Browser accepted configuration");
    await page.getByLabel("Stable key",{exact:true}).fill(`browser.${suffix}`);
    await page.getByLabel("Description",{exact:true}).fill("Created through the real Admin form");
    await page.getByRole("button",{name:"Create draft",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Browser accepted configuration",exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Validate saved draft",exact:true}).click();
    await expect(page.locator('[aria-label="Validation results"]')).toContainText("checksum");
    await page.getByRole("button",{name:"Publish saved draft",exact:true}).click();
    await expect(page.getByRole("button",{name:"Activate this version",exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Activate this version",exact:true}).click();
    await expect(page.getByText("A published version is active",{exact:false})).toBeVisible();
    await page.setViewportSize({width:390,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Studio mobile overflow");
    await page.setViewportSize({width:1440,height:1000});
    await page.goto("/studio",{waitUntil:"networkidle"}); assert(new URL(page.url()).pathname.startsWith("/atlas/studio"));
    for (const address of ["/atlas","/home","/sales","/manufacturing","/templates"]) {
      const response=await page.goto(address,{waitUntil:"networkidle"});assert(response && response.status()<400,`Existing page ${address}`);
    }
    assert.equal(errors,0);assert.equal(assets,0);
    console.log("PASS real Admin create/validate/publish/activate forms, staff/customer route separation, company login addresses, existing Atlas/Sales/Manufacturing/Templates pages; zero browser/asset errors");
    console.log("LIVE STUDIO PHASE 1 ACCEPTANCE PASSED");
  } finally {
    await browser.close();
    await db.organisation.updateMany({where:{id:{in:ids},isTest:true,slug:{startsWith:"studio-check-"}},data:{status:"SUSPENDED"}});
    await db.$disconnect();console.log("Synthetic Test companies suspended; audited history retained; QA identity unchanged.");
  }
}
main().catch(error=>{console.error(error instanceof Error?error.message:"Studio acceptance failed");process.exitCode=1;});
