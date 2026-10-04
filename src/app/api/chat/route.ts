import { chatSnapshot, openChat, searchChatRecords, searchChatPeople, sendChat } from "@/app/(app)/chat/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { op?: string; activeId?: string; userIds?: string[]; contactIds?: string[]; query?: string; input?: Parameters<typeof sendChat>[0] };
    const op = body.op;
    const value = op === "snapshot" ? await chatSnapshot(body.activeId)
      : op === "open" ? await openChat(body.userIds ?? [], body.contactIds ?? [])
      : op === "search" ? await searchChatRecords(String(body.query ?? ""))
      : op === "searchPeople" ? await searchChatPeople(String(body.query ?? ""))
      : op === "send" && body.input ? await sendChat(body.input)
      : null;
    if (op !== "snapshot" && op !== "open" && op !== "search" && op !== "searchPeople" && op !== "send") throw new Error("Chat could not be reached.");
    return Response.json({ value }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat could not be reached.";
    const status = message.includes("FORBIDDEN") ? 403 : message.includes("UNAUTHENTICATED") ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}
