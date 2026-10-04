import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ChatDock } from "./chat-dock";

export default async function ChatPage() {
  const session = await requireSession();
  assertCapability(session, "core.chat.read");
  return <ChatDock variant="page" />;
}
