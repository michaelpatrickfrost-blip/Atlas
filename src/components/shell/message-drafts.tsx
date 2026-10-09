"use client";
import { createContext, useRef, type ReactNode, type RefObject } from "react";
import type { ChatLinkType } from "@/core/chat/policy";
export type MessageDraft = {
  body: string;
  links: Array<{
    type: ChatLinkType;
    id: string;
    title: string;
    subtitle: string;
    href: string;
  }>;
  mode: "message" | "note" | "task" | "follow" | "request" | "meeting";
  assignee: string;
  due: string;
  starts: string;
  priority: string;
};
type DraftBuffer = {
  drafts: Map<string, MessageDraft>;
  lastConversation: string | null;
};
export const MessageDraftContext = createContext<RefObject<DraftBuffer> | null>(
  null,
);
/** Unsaved composer state only. AppLayout keys this provider to the authenticated company/user. */
export function MessageDraftProvider({ children }: { children: ReactNode }) {
  const buffer = useRef<DraftBuffer>({
    drafts: new Map(),
    lastConversation: null,
  });
  return (
    <MessageDraftContext.Provider value={buffer}>
      {children}
    </MessageDraftContext.Provider>
  );
}
