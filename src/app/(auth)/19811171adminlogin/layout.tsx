import { ADMIN_ROBOTS } from "@/core/auth/admin-address";

export const metadata = { title: "Atlas administration", robots: ADMIN_ROBOTS, referrer: "no-referrer" as const };

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
