function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const SIZE_CLASSES = { sm: "size-6 text-[10px]", md: "size-8 text-xs", lg: "size-10 text-sm" } as const;

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof SIZE_CLASSES }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--color-atlas-blue)] font-medium text-white ${SIZE_CLASSES[size]}`}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
