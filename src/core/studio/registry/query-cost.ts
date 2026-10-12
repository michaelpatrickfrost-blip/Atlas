import { z } from "zod";
/** Original Page query weights. Nested content uses actual approved query
 * descriptors in the enclosing Page's units, never an owner's private budget. */
export function pageQueryCostWeight(input: unknown): number {
  return { low: 1, medium: 3, high: 8 }[z.enum(["low", "medium", "high"]).parse(input)];
}
