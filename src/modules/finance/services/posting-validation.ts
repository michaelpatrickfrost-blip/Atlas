import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { projectScope } from "@/core/permissions/work-access";
import { DIMENSIONS, validateDimensions } from "../domain/accounting";
import type { PostingLine } from "./ledger";

export async function validatePostingLines(tx: Prisma.TransactionClient, session: Session, entityId: string, currency: string, lines: PostingLine[]) {
  const organisationId = session.organisationId, ids = [...new Set(lines.map(line => line.accountId))];
  const accounts = await tx.financeAccount.findMany({ where: { organisationId, entityId, id: { in: ids }, active: true, postingAllowed: true } });
  if (accounts.length !== ids.length) throw new Error("Choose active posting accounts from this legal entity.");
  const values = await tx.financeDimensionValue.findMany({ where: { organisationId, entityId, dimension: { in: ["department", "costCentre"] } } });
  for (const line of lines) {
    const account = accounts.find(account => account.id === line.accountId)!;
    if (account.currencyRestriction && account.currencyRestriction !== currency) throw new Error(`Account ${account.code} requires ${account.currencyRestriction}.`);
    validateDimensions(account.dimensionRules, line);
    for (const dimension of DIMENSIONS.slice(0, 2)) {
      const value = line[dimension];
      const configured = values.filter(value => value.dimension === dimension);
      if (value && configured.length && !configured.some(item => item.code === value && item.active)) throw new Error(`Choose an active ${dimension} value from this entity.`);
    }
    if (line.site && !await tx.site.findFirst({ where: { organisationId, OR: [{ id: line.site }, { code: line.site }] }, select: { id: true } })) throw new Error("Site must reference an existing company site.");
    if (line.projectId) {
      assertCapability(session, "projects.read");
      await tx.project.findFirstOrThrow({ where: { AND: [projectScope(session), { id: line.projectId }] }, select: { id: true } });
    }
    if (line.partyId) await tx.party.findFirstOrThrow({ where: { organisationId, id: line.partyId }, select: { id: true } });
    if (line.productId) await tx.product.findFirstOrThrow({ where: { organisationId, id: line.productId }, select: { id: true } });
  }
}
