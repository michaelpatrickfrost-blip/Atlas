"use server";

import { requireSession } from "@/core/auth/session";
import { createSalesProject } from "@/modules/crm/services/sales-projects-commands";

export async function createSalesProjectAction(input: {
  name: string;
  description?: string;
  potentialValueAmount?: number;
}) {
  try {
    const session = await requireSession();

    const project = await createSalesProject({
      name: input.name,
      description: input.description,
      ownerUserId: session.userId,
      potentialValueAmount: input.potentialValueAmount,
    });

    return { projectId: project.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create project" };
  }
}
