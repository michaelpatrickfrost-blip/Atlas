import { ModuleSpace } from "@/components/shell/module-space";
import { ticketingManifest } from "@/modules/tickets/manifest";

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={ticketingManifest}>{children}</ModuleSpace>;
}
