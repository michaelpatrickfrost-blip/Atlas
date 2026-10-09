"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileSpreadsheet,
  Home,
  ListTodo,
  MessageSquare,
  Settings,
} from "lucide-react";
const icons = {
  Home,
  Reports: FileSpreadsheet,
  "My tasks": ListTodo,
  Messages: MessageSquare,
  Settings,
};
export function WorkspaceNavigation({
  links,
}: {
  links: Array<{ name: keyof typeof icons; href: string }>;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Workspace utilities"
      className="flex gap-1 rounded-[24px] border border-white/90 bg-white/75 p-2 shadow-[0_8px_40px_-28px_rgba(44,81,136,0.3)] lg:h-full lg:flex-col lg:gap-2 lg:p-2.5"
    >
      {links.map(({ name, href }) => {
        const Icon = icons[name],
          active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            onClick={
              name === "Messages"
                ? (event) => {
                    if (
                      !event.metaKey &&
                      !event.ctrlKey &&
                      !event.shiftKey &&
                      !event.altKey
                    ) {
                      event.preventDefault();
                      window.dispatchEvent(new CustomEvent("atlas:open-chat"));
                    }
                  }
                : undefined
            }
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:flex-row sm:gap-3 lg:min-h-12 lg:flex-none lg:justify-start ${active ? "bg-[#eaf3ff] text-[#075bff]" : "text-[#526587] hover:bg-blue-50 hover:text-blue-700"}`}
          >
            <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
            <span className="text-[9px] sm:text-xs">{name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
