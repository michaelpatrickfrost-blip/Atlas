function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const SIZE_CLASSES = { sm: "size-8 text-[11px]", md: "size-9 text-xs", lg: "size-12 text-sm" } as const;

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof SIZE_CLASSES }) {
  return (
    <div
      className={`atlas-avatar flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#c8a57e,#b3854f)] font-semibold text-white shadow-sm ring-2 ring-white ${SIZE_CLASSES[size]}`}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
