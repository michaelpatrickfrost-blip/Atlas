"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { canReadPolicies, policyAudiences } from "@/core/permissions/hr-access";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { writeAudit } from "@/core/audit/log";
import { revalidatePath } from "next/cache";
import { dateOnly } from "@/modules/people/domain/working-time";
import { POLICY_CATEGORIES, choice } from "@/modules/people/domain/conduct";
import { readPolicyPdf } from "@/modules/people/domain/policy-file";

async function policySession(manage = false) {
  const session = await requireSession();
  if (manage) assertCapability(session, HR.policyManage);
  else if (!canReadPolicies(session)) throw new Error("FORBIDDEN: company policies are not included in your access.");
  await assertModuleEnabled(session, "people");
  return session;
}

export async function listPolicies() {
  const session = await policySession();
  return db.hrPolicy.findMany({
    where: { organisationId: session.organisationId, audience: { in: [...policyAudiences(session)] }, ...(can(session, HR.policyManage) ? {} : { status: "PUBLISHED" }) },
    select: { id: true, title: true, category: true, summary: true, audience: true, status: true, effectiveOn: true, reviewOn: true, fileName: true, createdAt: true },
    orderBy: [{ status: "asc" }, { title: "asc" }],
  });
}

export async function publishPolicy(form: FormData) {
  const session = await policySession(true);
  const title = String(form.get("title") ?? "").trim();
  if (!title || title.length > 160) throw new Error("Enter a policy title of 160 characters or fewer.");
  const summary = String(form.get("summary") ?? "").trim();
  if (summary.length > 1000) throw new Error("The summary must be 1,000 characters or fewer.");
  const file = await readPolicyPdf(form.get("file"));
  const effectiveOn = dateOnly(String(form.get("effectiveOn") ?? ""));
  const review = String(form.get("reviewOn") ?? "").trim();
  const policy = await db.hrPolicy.create({ data: {
    organisationId: session.organisationId,
    title,
    category: choice(String(form.get("category") ?? ""), POLICY_CATEGORIES, "category"),
    summary: summary || null,
    audience: choice(String(form.get("audience") ?? "EVERYONE"), ["EVERYONE", "MANAGERS", "HR"] as const, "audience"),
    effectiveOn,
    reviewOn: review ? dateOnly(review) : null,
    fileName: file.fileName,
    checksum: file.checksum,
    content: file.bytes,
    uploadedByUserId: session.userId,
  } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "policy.published", entityType: "HrPolicy", entityId: policy.id, after: { title, audience: policy.audience, fileName: file.fileName } });
  revalidatePath("/people/policies");
  revalidatePath("/people/me");
}

export async function archivePolicy(id: string) {
  const session = await policySession(true);
  const policy = await db.hrPolicy.findFirstOrThrow({ where: { id, organisationId: session.organisationId }, select: { id: true, status: true } });
  if (policy.status === "ARCHIVED") return;
  await db.hrPolicy.update({ where: { id }, data: { status: "ARCHIVED" } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "policy.archived", entityType: "HrPolicy", entityId: id });
  revalidatePath("/people/policies");
  revalidatePath("/people/me");
}

export async function openPolicy(id: string) {
  const session = await policySession();
  const policy = await db.hrPolicy.findFirst({ where: { id, organisationId: session.organisationId, audience: { in: [...policyAudiences(session)] }, ...(can(session, HR.policyManage) ? {} : { status: "PUBLISHED" }) }, select: { fileName: true, content: true } });
  if (!policy) throw new Error("FORBIDDEN: that policy is not available to you.");
  return { name: policy.fileName, mimeType: "application/pdf", base64: Buffer.from(policy.content).toString("base64") };
}
