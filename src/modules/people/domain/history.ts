import { db } from "@/core/db/client";

export async function logEmployeeHistory(params: { organisationId: string; employeeId: string; type: string; description: string }) {
  await db.employeeHistoryEvent.create({
    data: { organisationId: params.organisationId, employeeId: params.employeeId, type: params.type, description: params.description },
  });
}
