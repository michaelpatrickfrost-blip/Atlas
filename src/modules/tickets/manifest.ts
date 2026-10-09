import { Ticket as TicketIcon } from "lucide-react";
import { ticketSearch, ticketAttention } from "@/core/service-work/queries";
import type { ModuleManifest } from "@/core/modules/types";
import { TICKETING_CAPABILITIES } from "@/core/permissions/capabilities";
import { ticketStudioContract } from "@/core/service-work/studio";

export const ticketingManifest: ModuleManifest = {
  id: "tickets",
  name: "Tickets",
  description: "Internal service requests, incidents and cross-team work for every department.",
  icon: TicketIcon,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(TICKETING_CAPABILITIES),
  rootPath: "/tickets",
  accessCapability: TICKETING_CAPABILITIES.ticketRead,
  status: "available",
  searchProvider: ticketSearch,
  attentionProvider: ticketAttention,
  studio: ticketStudioContract,
  navigation: [
    { label: "Overview", href: "/tickets", capability: TICKETING_CAPABILITIES.ticketRead },
    { label: "Queues", href: "/tickets/queues", capability: TICKETING_CAPABILITIES.queueRead, group: "Admin" },
    { label: "My work", href: "/tickets?mine=1", capability: TICKETING_CAPABILITIES.ticketRead },
    { label: "Service catalogue", href: "/tickets/catalogue", capability: TICKETING_CAPABILITIES.ticketCreate },
    { label: "Knowledge", href: "/tickets/knowledge", capability: TICKETING_CAPABILITIES.ticketRead, group: "Insights" },
    { label: "Reports", href: "/tickets/reports", capability: TICKETING_CAPABILITIES.ticketRead, group: "Insights" },
  ],
};
