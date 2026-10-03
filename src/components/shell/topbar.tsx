import {WorkspaceBack} from "./workspace-back";
import Link from "next/link";
import {Grid2X2,Settings,MessageCircle,Users,ArrowUpRight,ShieldCheck} from "lucide-react";
import {logoutAction} from "@/core/auth/actions";
import {CommandPalette} from "./command-palette";
import {Avatar} from "@/components/ui/avatar";
import {CreateDialog} from "@/components/ui/create-dialog";
import {getNavigableModules} from "@/core/modules/runtime";
import {can} from "@/core/permissions/check";
import {CUSTOMER_CAPABILITIES,CORE_CAPABILITIES} from "@/core/permissions/capabilities";
import type {Session} from "@/core/auth/session";
export async function Topbar({session}:{session:Session}) {
 const modules=await getNavigableModules(session);
 const apps=[...(can(session,"atlas.companies.manage")?[{id:"platform",name:"Atlas console",rootPath:"/atlas",icon:ShieldCheck}]:[]),...(can(session,CUSTOMER_CAPABILITIES.read)?[{id:'customers',name:'Customers',rootPath:'/customers',icon:Users}]:[]),...modules,...(can(session,CORE_CAPABILITIES.chatRead)?[{id:'chat',name:'Team chat',rootPath:'/chat',icon:MessageCircle}]:[]),...(can(session,CORE_CAPABILITIES.usersManage)?[{id:'settings',name:'Company admin',rootPath:'/settings',icon:Settings}]:[])];
 return <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/95 px-4 sm:gap-5 sm:px-8"><Link href="/home" aria-label="Atlas home" className="flex shrink-0 items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm"><Grid2X2 size={19}/></span><span className="hidden text-lg font-semibold tracking-tight text-slate-900 sm:inline">Atlas</span></Link><WorkspaceBack/><CreateDialog title="Your apps" label="Switch app" iconOnly><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{apps.map(app=>{const Icon=app.icon;return <Link key={app.id} href={app.rootPath} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 text-sm font-medium transition hover:border-blue-200 hover:bg-blue-50"><Icon size={20} className="text-blue-600"/>{app.name}</Link>;})}</div><Link href="/home" className="mt-5 flex items-center gap-2 text-sm text-blue-600">Open app home<ArrowUpRight size={15}/></Link></CreateDialog><div className="min-w-0 flex-1 lg:max-w-lg"><CommandPalette/></div><span className="ml-auto hidden truncate rounded-full bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 lg:inline">{session.organisationName}</span><Link href="/profile" aria-label="Your profile" className="shrink-0"><Avatar name={session.userName}/></Link><form action={logoutAction}><button type="submit" className="hidden text-xs text-slate-500 hover:text-slate-900 sm:block">Sign out</button></form></header>;
}
