import {
  CORE_CAPABILITIES,
  CUSTOMER_CAPABILITIES,
} from "@/core/permissions/capabilities";
import { hrAccessGroups } from "@/core/permissions/hr-access";
import { MODULE_CATALOGUE } from "@/core/modules/registry";
import type { AccessGroup } from "@/core/permissions/access-levels";
/** Every implemented capability is discoverable; deduplication never drops a source section. */
export function accessGroups(): AccessGroup[] {
  const seen = new Set<string>();
  const core = Object.values(CORE_CAPABILITIES);
  const groups: AccessGroup[] = [
    {
      id: "platform",
      name: "Company administration & shared tools",
      capabilities: core.filter(
        (cap) =>
          !cap.startsWith("core.products.") && !cap.startsWith("core.pricing."),
      ),
    },
    {
      id: "customers",
      name: "Customers & relationships",
      capabilities: Object.values(CUSTOMER_CAPABILITIES),
    },
    {
      id: "products",
      name: "Products",
      capabilities: core.filter((cap) => cap.startsWith("core.products.")),
    },
    {
      id: "pricing",
      name: "Pricing",
      capabilities: core.filter((cap) => cap.startsWith("core.pricing.")),
    },
    ...MODULE_CATALOGUE.filter((m) => m.status !== "coming_soon").flatMap(
      (m) =>
        m.id === "people"
          ? [
              ...hrAccessGroups(),
              {
                id: "people-other",
                name: "HR — additional sections",
                capabilities: [...m.capabilities],
              },
            ]
          : [{ id: m.id, name: m.name, capabilities: [...m.capabilities] }],
    ),
  ];
  return groups
    .map((group) => ({
      ...group,
      capabilities: group.capabilities.filter((cap) => {
        if (
          seen.has(cap) ||
          cap === "core.profile.self" ||
          cap.startsWith("atlas.")
        )
          return false;
        seen.add(cap);
        return true;
      }),
    }))
    .filter((group) => group.capabilities.length);
}
