import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { Session } from "@/core/auth/session";

/** One entry in a module's secondary navigation (shown once the module is open). */
export type ModuleNavItem = {
  label: string;
  href: string;
  /** Capability required to see this item. Omit for items available to anyone with module access. */
  capability?: string;
};

/** A contribution to the Home "Needs your attention" list. Modules implement the
 *  provider function; Core only ever calls it and renders the result — Core never
 *  encodes module-specific business rules. See docs/MODULE_SPEC.md §Attention. */
export type AttentionItem = {
  id: string;
  label: string;
  href: string;
  /** Visual severity. "critical" renders in red and is reserved for genuine problems. */
  severity: "info" | "warning" | "critical";
};

export type AttentionProvider = (ctx: { organisationId: string; session: Session }) => Promise<AttentionItem[]>;

/** A result the global command palette can show for a free-text query. */
export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  group: string;
};

export type SearchProvider = (ctx: {
  organisationId: string;
  session: Session;
  query: string;
}) => Promise<SearchResult[]>;

/** The machine-readable contract every module declares. See docs/MODULE_SPEC.md. */
export type ModuleManifest = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  version: string;
  minimumCoreVersion: string;
  /** Module ids this module depends on. Core refuses to enable this module until they're enabled. */
  dependencies: string[];
  /** Capability strings this module declares. Used to populate the role editor. */
  capabilities: string[];
  /** Root path for this module's primary nav entry, e.g. "/sales". */
  rootPath: string;
  /** Capability required to see this module in navigation and the Apps screen "open" action. */
  accessCapability: string;
  navigation: ModuleNavItem[];
  /** Status shown on the Apps & Modules screen for modules not yet implemented. */
  status: "available" | "installed" | "coming_soon";
  attentionProvider?: AttentionProvider;
  searchProvider?: SearchProvider;
  /** Lazily-loaded home widget contributed to module-relevant surfaces (optional, future use). */
  widget?: ComponentType;
};
