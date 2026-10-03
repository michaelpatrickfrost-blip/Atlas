export function AtlasLogo({ className = "h-8 w-auto", onDark = false }: { className?: string; onDark?: boolean }) {
  return <img src="/brand/atlas-logo.png" alt="Atlas" className={`block max-w-full object-contain object-left ${onDark ? "brightness-0 invert" : ""} ${className}`} />;
}
