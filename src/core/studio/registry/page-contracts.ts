import { checksum } from "./contracts";
import type { ContractIdentity, Contribution } from "./types";
import { pageSourcePolicySchema, type PageSourceCallbacks, type PageSourcePolicy } from "../pages/owner-contract";

/** New descriptive contribution; generic invocation never calls its adapters. */
export function pageSource(descriptor: ContractIdentity & { policy: PageSourcePolicy; callbacks: PageSourceCallbacks }): Contribution {
  const policy = pageSourcePolicySchema.parse(descriptor.policy), callbacks = descriptor.callbacks;
  if (!callbacks || [callbacks.authoriseRead, callbacks.bindQueryInput, callbacks.projectQueryOutput].some(value => typeof value !== "function"))
    throw new Error("Page source requires explicit owning read/input/projection adapters.");
  const { id, version, label, capability, lifecycle, classification, supportedUntil } = descriptor;
  return { metadata: { id, version, label, capability, lifecycle, classification, ...(supportedUntil ? { supportedUntil } : {}),
    kind: "surface", schemaHash: checksum(policy), details: { pageSource: policy } }, pageSource: { ...callbacks } };
}
