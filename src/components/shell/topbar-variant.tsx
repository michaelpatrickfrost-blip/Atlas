"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function TopbarVariant({ home, regular }: { home: ReactNode; regular: ReactNode }) {
  return usePathname() === "/home" ? home : regular;
}
