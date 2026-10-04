"use client";

import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({ error }: { error: Error & { message: string } }) {
  const isForbidden = error.message.startsWith("FORBIDDEN");
  const isUnauthenticated = error.message === "UNAUTHENTICATED";

  if (isUnauthenticated) {
    return <EmptyState title="Your session has expired." description="Sign in again to continue." />;
  }

  return (
    <EmptyState
      title={isForbidden ? "You don't have permission to view this." : "Something went wrong."}
      description={isForbidden ? "Ask an administrator for access if you think this is a mistake." : "Your records are still on the server. Open the page again from the sidebar."}
    />
  );
}
