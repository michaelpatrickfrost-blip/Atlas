import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { appAppearance } from "./app-appearance";

/** Shared module chrome: mark, title and icon tabs. Same destinations, one product header. */
export function AppHeader({ icon: Icon, title, eyebrow, children, appId }: { icon: LucideIcon; title: string; eyebrow?: string; children?: ReactNode; appId?: string }) {
  return (
    <header className="atlas-app-header" style={appId ? appAppearance(appId) : undefined}>
      <div className="flex min-w-0 items-center gap-4">
        <span className="atlas-app-mark atlas-app-icon"><Icon size={26} strokeWidth={1.65} aria-hidden="true" /></span>
        <div className="min-w-0">
          {eyebrow && <p className="atlas-eyebrow">{eyebrow}</p>}
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        </div>
      </div>
      {children && <nav className="atlas-app-nav" aria-label={`${title} navigation`}>{children}</nav>}
    </header>
  );
}
