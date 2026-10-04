import { Briefcase, Home, LayoutGrid, MessageCircle, Settings, Users } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { ActiveLink } from "./active-link";

function Item({ href, match, icon: Icon, label }: { href: string; match?: string; icon: typeof Home; label: string }) {
  return (
    <ActiveLink href={href} match={match} className="atlas-nav flex items-center gap-3 px-3 py-2 text-[13px]">
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <span className="truncate">{label}</span>
    </ActiveLink>
  );
}

export function NavLinks({ modules, showCustomers, showSettings = false, showCompanyAdmin = false, showChat = false }: { modules: ModuleManifest[]; showCustomers: boolean; showSettings?: boolean; showCompanyAdmin?: boolean; showChat?: boolean }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
      <Item href="/home" icon={Home} label="Workspace" />
      <Item href="/profile" icon={Briefcase} label="My work" />
      {showChat && <Item href="/chat" icon={MessageCircle} label="Team chat" />}
      <p className="mb-1 mt-5 px-3 text-[11px] font-medium text-[#86868b]">Apps</p>
      {showCustomers && <Item href="/customers" icon={Users} label="Customers" />}
      {modules.map((module) => (
        <Item key={module.id} href={module.rootPath} match={`/${module.id}`} icon={module.icon} label={module.name} />
      ))}
      <div className="mt-auto space-y-1 pt-6">
        {showSettings && <Item href="/apps" icon={LayoutGrid} label="Manage apps" />}
        {showCompanyAdmin && <Item href="/settings" icon={Settings} label="Company admin" />}
      </div>
    </nav>
  );
}
