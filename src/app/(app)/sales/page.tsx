import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
export default async function SalesHome() {
  const session = await requireSession();
  redirect(can(session, "sales.order.read") ? "/sales/documents" : "/sales/price-lists");
}
