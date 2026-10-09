export function AtlasLogo({ className = "h-8 w-auto", onDark = false, full = false }: { className?: string; onDark?: boolean; full?: boolean }) {
  return <img src={full ? "/brand/atlas-logo.png" : "/brand/atlas-wordmark.png"} alt={full ? "Atlas — Plan. Make. Deliver." : "Atlas"} width={full ? 905 : 900} height={full ? 715 : 145} className={`block max-w-full object-contain ${onDark ? "brightness-0 invert" : ""} ${className}`} />;
}
