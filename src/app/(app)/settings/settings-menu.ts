import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";

export type SettingsLink = { group: string; label: string; href: string; hint: string };

/** Sections a person can open. Company identity and workspace switches stay with company administrators. */
export function settingsLinks(session: Session): SettingsLink[] {
  const company = can(session, "core.modules.manage");
  const users = can(session, "core.users.manage");
  const roles = can(session, "core.roles.manage");
  const imports = can(session, "customers.create") || can(session, "core.products.manage") || can(session, "core.pricing.manage");
  const audit = can(session, "core.audit.read");
  const it = can(session, "core.it.manage");
  const mailbox = can(session, "core.email.personal");
  const links: SettingsLink[] = [];
  if (it || mailbox) {
    links.push({ group: it ? "Company" : "IT", label: "Email accounts", href: "/settings/it/email", hint: it ? "Send and receive from company mailboxes" : "Send from your own address" });
    links.push({ group: it ? "Company" : "IT", label: "Email templates", href: "/settings/it/templates", hint: "Branded template maker" });
  }
  if (it) links.push({ group: "Company", label: "Social media accounts", href: "/settings/it/social", hint: "Facebook, Instagram and Threads for the scheduler" });
  if (company) {
    links.push(
      { group: "Company", label: "Workspace", href: "/settings?tab=workspace", hint: "Identity, currency and apps" },
      { group: "Company", label: "Brand", href: "/settings?tab=brand", hint: "Logo, colour and invoice terms" },
      { group: "Company", label: "Sales rules", href: "/sales/settings", hint: "Pointers, fields and approvals" },
      { group: "Company", label: "Logistics", href: "/settings/logistics", hint: "Dispatch and delivery" },
      { group: "Company", label: "Audit access", href: "/audit/access", hint: "Areas and own activity" },
      { group: "Company", label: "Manager level", href: "/settings?tab=managers", hint: "Assign work and sign off" },
      { group: "Company", label: "HR defaults", href: "/people/settings", hint: "Hours, overtime and templates" },
    );
  }
  if (users) {
    links.push(
      { group: "People", label: "Users", href: "/settings?tab=users", hint: "Accounts and sign-in" },
      { group: "People", label: "Management groups", href: "/settings/groups", hint: "Departments and managers" },
    );
    if (!company) links.push({ group: "People", label: "Audit access", href: "/audit/access", hint: "Areas and own activity" });
  }
  if (roles) links.push({ group: "People", label: "Roles & permissions", href: "/settings?tab=roles", hint: "What each role can do" });
  if (imports) links.push({ group: "Records", label: "Imports", href: "/settings/imports", hint: "Customers, products and prices" });
  if (audit) links.push({ group: "Records", label: "Audit", href: "/settings/audit", hint: "Who changed what" });
  if (users || company) links.push({ group: "Account", label: "Security", href: "/settings?tab=security", hint: "Recovery and sessions" });
  links.push({ group: "Account", label: "Your profile", href: "/profile", hint: "Password and your own access" });
  return links;
}

export function settingsNav(session: Session) {
  const groups: Array<{ label: string; items: Array<{ label: string; href: string; hint: string }> }> = [];
  for (const link of settingsLinks(session)) {
    const group = groups.find((entry) => entry.label === link.group) ?? groups[groups.push({ label: link.group, items: [] }) - 1];
    group.items.push({ label: link.label, href: link.href, hint: link.hint });
  }
  return groups;
}

export function defaultSettingsHref(session: Session) {
  return settingsLinks(session).find((link) => link.href.startsWith("/settings"))?.href ?? "/profile";
}

export function canOpenCompanyAdmin(session: Session) {
  return settingsLinks(session).some((link) => link.href.startsWith("/settings"));
}
