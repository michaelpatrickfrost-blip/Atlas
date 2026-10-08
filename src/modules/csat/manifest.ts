import { csatGoalMetrics } from "./services/goal-metrics";
import { surveyResolvedServiceCase } from "./services/service-case";
import { Smile } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { CSAT_CAPABILITIES } from "@/core/permissions/capabilities";

export const csatManifest: ModuleManifest = {
 analyticsProvider: csatGoalMetrics,
 serviceSurveyConsumer:surveyResolvedServiceCase,
  id: "csat",
  name: "Satisfaction (CSAT)",
  description: "Branded satisfaction surveys sent after an order, delivery or case closes, with results in one place.",
  icon: Smile,
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],
  capabilities: Object.values(CSAT_CAPABILITIES),
  rootPath: "/csat",
  accessCapability: CSAT_CAPABILITIES.read,
  status: "available",
  navigation: [
    { label: "Results", href: "/csat", capability: CSAT_CAPABILITIES.read },
    { label: "Surveys", href: "/csat/surveys", capability: CSAT_CAPABILITIES.manage },
  ],
};
