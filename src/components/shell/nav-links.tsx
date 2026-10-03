import { Home, LayoutGrid, Settings, Users, MessageCircle } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
import { ActiveLink } from "./active-link";
export function NavLinks({ modules, showCustomers, showSettings = false, showChat = false }: { modules: ModuleManifest[]; showCustomers: boolean; showSettings?: boolean; showChat?: boolean }) {
 const style = "atlas-nav flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-black/5";
 return <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
  <ActiveLink href="/home" className={style}><Home size={18} strokeWidth={1.6}/>Workspace</ActiveLink>
  {showChat && <ActiveLink href="/chat" className={style}><MessageCircle size={18} strokeWidth={1.6}/>Team chat</ActiveLink>}
  <p className="mb-1 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Your apps</p>
  {showCustomers && <ActiveLink href="/customers" className={style}><Users size={18} strokeWidth={1.6}/>Customers</ActiveLink>}
  {modules.map((module) => { const Icon = module.icon; return <ActiveLink key={module.id} href={module.rootPath} match={`/${module.id}`} className={style}><Icon size={18} strokeWidth={1.6}/>{module.name}</ActiveLink>; })}
  <div className="mt-auto pt-8">
   {showSettings && <ActiveLink href="/apps" className={style}><LayoutGrid size={18} strokeWidth={1.6}/>Manage apps</ActiveLink>}
   <ActiveLink href="/settings" className={style}><Settings size={18} strokeWidth={1.6}/>Settings</ActiveLink>
  </div>
 </nav>;
}
