"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncDemandAction } from "@/app/(app)/logistics/actions";

export function DemandSync() {
  const router = useRouter();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    syncDemandAction().then(() => router.refresh()).catch(() => undefined);
  }, [router]);
  return null;
}
