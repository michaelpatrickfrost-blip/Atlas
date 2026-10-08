import { ModuleSpace } from "@/components/shell/module-space";
import { ticketingManifest } from "@/modules/tickets/manifest";
import { requireSession } from "@/core/auth/session";
import { serviceWorkRestriction } from "@/components/service-work/access-state";

export default async function TicketsLayout({ children }: { children: React.ReactNode }) {
  const restriction = await serviceWorkRestriction(await requireSession(), "TICKET");
  if (restriction) return restriction;
  return <ModuleSpace module={ticketingManifest}>{children}</ModuleSpace>;
}
