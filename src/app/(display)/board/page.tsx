import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { loadBoardWidgets } from "@/modules/analytics/data-views";
import { db } from "@/core/db/client";
import {
  DASHBOARD_PREFIX,
  readBoardSettings,
  readWidgets,
} from "@/modules/analytics/definition";
import { Wall } from "@/modules/analytics/components/wall";
import { loadGoalMarkers } from "@/modules/kpis/services/workspace";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ dashboard?: string; period?: string }>;
}) {
  const session = await requireSession();
  assertCapability(session, "analytics.dashboard.read");
  await assertModuleEnabled(session, "analytics");
  const params = await searchParams;
  const saved = await db.dashboard.findMany({
    where: {
      organisationId: session.organisationId,
      userId: session.userId,
      name: { startsWith: DASHBOARD_PREFIX },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, widgets: true },
  });
  const board = saved.find((item) => item.id === params.dashboard) ?? saved[0];
  if (!board)
    return (
      <main className="grid min-h-screen place-items-center bg-[#070b14] text-white">
        <p>Save a dashboard first, then open it on a monitor.</p>
      </main>
    );
  const period = ["30", "90", "365", "all"].includes(params.period ?? "")
    ? params.period!
    : readBoardSettings(board.widgets).period;
  const [metrics, goals] = await Promise.all([
    loadBoardWidgets(
      session,
      readWidgets(board.widgets),
      readBoardSettings(board.widgets).filters,
      period,
    ),
    loadGoalMarkers(session),
  ]);
  return (
    <Wall
      name={board.name.slice(DASHBOARD_PREFIX.length)}
      company={session.organisationName}
      widgets={readWidgets(board.widgets)}
      data={metrics}
      filters={readBoardSettings(board.widgets).filters}
      period={period}
      refreshSeconds={readBoardSettings(board.widgets).refreshSeconds}
      boards={saved.map((item) => ({
        id: item.id,
        name: item.name.slice(DASHBOARD_PREFIX.length),
      }))}
      goals={goals}
    />
  );
}
