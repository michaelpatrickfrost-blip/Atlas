import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import type { SalesPointerSurface } from "@/modules/sales/domain/pointers";
import { readSalesPolicy } from "@/modules/sales/services/sales-policy";
import { SalesPointerNotes } from "./sales-pointer-notes";

export async function SalesPointerPanel({ surface }: { surface: SalesPointerSurface }) {
  const session = await requireSession();
  const organisation = await db.organisation.findUnique({ where: { id: session.organisationId }, select: { salesPolicy: true } });
  return <SalesPointerNotes pointers={readSalesPolicy(organisation?.salesPolicy).pointers} surface={surface} />;
}
