import { z } from "zod";
import { parseBlocks, validateFields } from "./domain";
import { TARGET_MODULES, type TemplateBlock } from "./types";

export type TemplateAuthoringContent = {
  name: string; titleTemplate: string; description: string; category: string;
  blocks: TemplateBlock[]; targetModules: string[]; status: "DRAFT" | "PUBLISHED";
};
export type TemplateAuthoringInput = { id: string; version: number | null; data: TemplateAuthoringContent };
const versionSchema = z.number().int().positive().max(2147483646);
/** The original native save grammar, shared without relaxing publication or CAS input. */
function string(form: FormData, key: string, max = 300) {
  const value = form.get(key);
  if (value !== null && typeof value !== "string") throw new Error(`${key} must be text.`);
  const text = (value ?? "").trim();
  if (text.length > max) throw new Error(`${key} is too long.`);
  return text;
}
export function parseTemplateSave(form: FormData): TemplateAuthoringInput {
  const id = string(form, "id", 100), name = string(form, "name"), titleTemplate = string(form, "titleTemplate"),
    description = string(form, "description", 2000), category = string(form, "category", 60), status = string(form, "status");
  if (!name || !titleTemplate) throw new Error("Enter a name and document title.");
  if (status !== "DRAFT" && status !== "PUBLISHED") throw new Error("Choose draft or published.");
  let raw: unknown;
  try { raw = JSON.parse(string(form, "blocks", 70000)); }
  catch { throw new Error("The template sections are invalid."); }
  const blocks = parseBlocks(raw);
  validateFields(`${titleTemplate}\n${blocks.map(block => block.text).join("\n")}`);
  const targets = form.getAll("targetModules");
  if (!targets.length || targets.some(target => typeof target !== "string" || !TARGET_MODULES.includes(target as typeof TARGET_MODULES[number])))
    throw new Error("Choose at least one target app.");
  const targetModules = targets.map(String);
  const parsedVersion = id ? versionSchema.safeParse(Number(string(form, "version", 20))) : null;
  if (id && !parsedVersion?.success) throw new Error("Reload this template.");
  return { id, version: parsedVersion?.success ? parsedVersion.data : null, data: { name, titleTemplate, description, category, blocks, targetModules, status } };
}
