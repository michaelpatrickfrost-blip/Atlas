import { db } from "@/core/db/client";

export async function getSalesProject(
  id: string,
  organisationId: string
) {
  return await db.salesProject.findFirst({
    where: { id, organisationId },
    include: {
      team: true,
      industry: true,
      organisations: {
        include: { party: true },
      },
      stakeholders: {
        include: { contact: { include: { party: true } } },
      },
      quotes: true,
      orders: true,
      activities: true,
    },
  });
}

export async function generateSalesProjectReference(
  organisationId: string
): Promise<string> {
  const latest = await db.salesProject.findFirst({
    where: { organisationId },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });

  if (!latest?.reference) return "SP-00001";

  // Extract number from reference like "SP-00184"
  const match = latest.reference.match(/^SP-(\d+)$/);
  if (!match) return "SP-00001";

  const nextNum = (parseInt(match[1], 10) + 1).toString().padStart(5, "0");
  return `SP-${nextNum}`;
}
