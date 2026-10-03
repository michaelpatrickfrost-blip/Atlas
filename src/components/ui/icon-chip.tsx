import type { LucideIcon } from "lucide-react";
import type { AccentColor } from "@/core/shared/module-colors";

const SIZE_CLASSES = { sm: "size-7", md: "size-9", lg: "size-11" } as const;
const ICON_SIZE = { sm: 14, md: 18, lg: 22 } as const;

/** A module's icon in its accent colour, used in the sidebar, Apps grid and
 *  anywhere else a module needs to be recognisable at a glance. */
export function IconChip({
  icon: Icon,
  size = "md",
  color,
}: {
  icon: LucideIcon;
  color: AccentColor;
  size?: keyof typeof SIZE_CLASSES;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-[var(--radius-atlas-sm)] ${SIZE_CLASSES[size]}`}
      style={{ background: `var(--color-accent-${color}-soft)`, color: `var(--color-accent-${color})` }}
    >
      <Icon size={ICON_SIZE[size]} strokeWidth={1.6} />
    </div>
  );
}
