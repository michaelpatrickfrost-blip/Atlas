import { requireSession } from "@/core/auth/session";
import { assertCapability,can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { Avatar } from "@/components/ui/avatar";
import { ChatCompose } from "./chat-compose";
import { Refresh } from "@/components/shell/refresh";
export default async function ChatPage() {
 const session=await requireSession();
 assertCapability(session,"core.chat.read");
 const messages=await db.chatMessage.findMany({where:{organisationId:session.organisationId},orderBy:{createdAt:'desc'},take:100});
 const users=await db.user.findMany({where:{id:{in:messages.map(m=>m.authorUserId)},memberships:{some:{organisationId:session.organisationId}}},select:{id:true,name:true}});
 const names=new Map(users.map(u=>[u.id,u.name]));
 return <div className="mx-auto max-w-3xl space-y-6"><Refresh/><div><p className="text-xs text-[var(--color-ink-muted)]">{session.organisationName}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Team chat</h1><p className="mt-2 text-sm text-[var(--color-ink-muted)]">Keep the conversation close to the work.</p></div><div className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-white p-6">{messages.length ? messages.reverse().map(m=><article key={m.id} className="flex gap-3"><Avatar name={names.get(m.authorUserId)??'Former member'} size="sm"/><div className="min-w-0 flex-1"><p className="text-xs"><span className="font-semibold">{names.get(m.authorUserId)??'Former member'}</span><time className="ml-3 text-[var(--color-ink-faint)]">{m.createdAt.toLocaleString('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</time></p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{m.body}</p></div></article>):<p className="py-8 text-center text-sm text-[var(--color-ink-muted)]">Start a conversation with your team.</p>}</div>{can(session,'core.chat.write')&&<ChatCompose/>}</div>;
}
