import { Users } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { TEAMS_CAPABILITIES } from "@/core/permissions/capabilities";
import { searchTeams, teamAttention } from "./services/queries";

export const teamsManifest: ModuleManifest = {
  id: "teams",
  name: "Team planner",
  description: "Your team, their holidays, cover, and the work the lead sets.",
  icon: Users,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: ["people"],
  capabilities: Object.values(TEAMS_CAPABILITIES),
  rootPath: "/teams",
  accessCapability: TEAMS_CAPABILITIES.read,
  status: "available",
  attentionProvider: async ({ session }) => teamAttention(session),
  searchProvider: async ({ session, query }) => searchTeams(session, query),
  navigation: [{ label: "Teams", href: "/teams", capability: TEAMS_CAPABILITIES.read }],
};
