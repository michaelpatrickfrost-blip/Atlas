import type { TemplateAuthoringInput } from "./authoring-input";

/** Metadata only. No resolved customer/record facts or permission grants. */
export type TemplateChange = {
  kind: "setting" | "section_added" | "section_removed" | "section_changed" | "section_moved";
  label: string; sectionId?: string;
};
export type TemplateDetailUse = {
  location: "title" | "section" | "table_cell"; label: string;
  sectionId?: string; row?: number; column?: number;
};
export type TemplateDetailInspection = {
  key: string; label: string;
  source: { kind: "company" | "customer" | "contact" | "record" | "date" | "custom"; label: string; description: string };
  uses: TemplateDetailUse[];
};
export type TemplateContextInspection = {
  id: string; version: number; label: string; ownerModuleId: string;
  lifecycle: "active" | "deprecated"; contractHash: string;
  listQuery: { id: string; version: number }; getQuery: { id: string; version: number };
};
export type TemplateDraftInspection = {
  valid: boolean; errors: string[];
  local: TemplateAuthoringInput | null; saved: TemplateAuthoringInput | null;
  currentVersion: number | null; changedSinceOpened: boolean;
  changes: TemplateChange[]; details: TemplateDetailInspection[]; contexts: TemplateContextInspection[];
};
