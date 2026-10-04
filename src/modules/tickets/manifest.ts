import { Ticket as TicketIcon } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { TICKETING_CAPABILITIES } from "@/core/permissions/capabilities";

export const ticketingManifest: ModuleManifest = {
  id: "tickets",
  name: "Ticketing",
  description: "Multi-queue ticketing system for IT, customer service, complaints and internal requests.",
  icon: TicketIcon,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(TICKETING_CAPABILITIES),
  rootPath: "/tickets",
  accessCapability: TICKETING_CAPABILITIES.ticketRead,
  status: "available",
  navigation: [
    { label: "My Tickets", href: "/tickets", capability: TICKETING_CAPABILITIES.ticketRead },
    { label: "Queues", href: "/tickets/queues", capability: TICKETING_CAPABILITIES.queueRead, group: "Admin" },
    { label: "Queue Setup", href: "/tickets/queues/manage", capability: TICKETING_CAPABILITIES.queueManage, group: "Admin" },
  ],
};
