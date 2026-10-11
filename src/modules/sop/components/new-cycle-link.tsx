"use client";
export function NewCycleLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const target = document.getElementById("new-cycle");
        if (target instanceof HTMLDetailsElement) {
          target.open = true;
          target.scrollIntoView({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
            block: "start",
          });
          target
            .querySelector<HTMLInputElement>('input[name="name"]')
            ?.focus({ preventScroll: true });
        }
      }}
    >
      {children}
    </button>
  );
}
