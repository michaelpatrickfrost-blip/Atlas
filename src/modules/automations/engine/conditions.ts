import type { Condition } from "./catalogue";
import type { LoadedContext } from "./context";

function at(ctx: LoadedContext, path: string): unknown {
  let cur: unknown = ctx.raw;
  for (const part of path.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[part];
    else return undefined;
  }
  return cur;
}

export function evaluateConditions(conditions: Condition[], ctx: LoadedContext): boolean {
  return conditions.every((c) => {
    const actual = at(ctx, c.field);
    switch (c.op) {
      case "empty": return actual === undefined || actual === null || actual === "";
      case "notEmpty": return !(actual === undefined || actual === null || actual === "");
      case "eq": return String(actual ?? "").toLowerCase() === String(c.value ?? "").toLowerCase();
      case "neq": return String(actual ?? "").toLowerCase() !== String(c.value ?? "").toLowerCase();
      case "contains": return String(actual ?? "").toLowerCase().includes(String(c.value ?? "").toLowerCase());
      case "notContains": return !String(actual ?? "").toLowerCase().includes(String(c.value ?? "").toLowerCase());
      case "gt": return Number(actual) > Number(c.value);
      case "gte": return Number(actual) >= Number(c.value);
      case "lt": return Number(actual) < Number(c.value);
      case "lte": return Number(actual) <= Number(c.value);
      default: return true;
    }
  });
}
