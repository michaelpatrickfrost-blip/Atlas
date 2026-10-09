import Link from "next/link";
import { ArrowLeft, Factory } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { canOpenSupplyConsole } from "../services/console";
export async function ConsoleReturn() {
  const session = await requireSession();
  if (!await canOpenSupplyConsole(session)) return null;
  return <Link href="/manufacturing" className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"><ArrowLeft size={13} /><Factory size={14} />Manufacturing & Supply console</Link>;
}
