import Link from "next/link";
import { Route, Users, Touchpad, GitBranch } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import {
  journeyMapSchema,
  journeyStageSchema,
  journeyTouchSchema,
  journeyPathSchema,
} from "../domain/planning";
import { createJourneyMap } from "../services/commands";
import { ActionForm } from "./action-form";
import { Choice, Field } from "./fields";
import { CreateDialog } from "@/components/ui/create-dialog";
import { WorkspaceHeading, WorkspaceStats } from "@/components/ui/workspace";
import { JourneyCanvas } from "./journey-canvas";

export async function MarketingJourneyMap({
  session,
  focus,
}: {
  session: Session;
  focus?: string;
}) {
  const where = { organisationId: session.organisationId };
  const [programs, campaigns] = await Promise.all([
    db.marketingProgram.findMany({
      where: { ...where, kind: "JOURNEY_MAP", status: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.marketingCampaign.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: 100,
    }),
  ]);
  const maps = programs.flatMap((program) => {
    const parsed = journeyMapSchema.safeParse(program.definition);
    return parsed.success
      ? [
          {
            id: program.id,
            name: program.name,
            campaignId: program.campaignId,
            who: parsed.data.who,
            updatedAt: program.updatedAt.toISOString(),
          },
        ]
      : [];
  });
  const selected = maps.find((map) => map.id === focus) ?? maps[0] ?? null;
  const [stageRows, touchRows, pathRows] = selected
    ? await Promise.all([
        db.marketingProgram.findMany({
          where: {
            ...where,
            kind: "JOURNEY_STAGE",
            definition: { path: ["journeyId"], equals: selected.id },
          },
          orderBy: { createdAt: "asc" },
          take: 31,
        }),
        db.marketingProgram.findMany({
          where: {
            ...where,
            kind: "JOURNEY_TOUCH",
            status: { not: "ARCHIVED" },
            definition: { path: ["journeyId"], equals: selected.id },
          },
          orderBy: { createdAt: "asc" },
          take: 501,
        }),
        db.marketingProgram.findMany({
          where: {
            ...where,
            kind: "JOURNEY_PATH",
            status: { not: "ARCHIVED" },
            definition: { path: ["journeyId"], equals: selected.id },
          },
          orderBy: { createdAt: "asc" },
          take: 101,
        }),
      ])
    : [[], [], []];
  const stages = stageRows
    .flatMap((row) => {
      const parsed = journeyStageSchema.safeParse(row.definition);
      return parsed.success
        ? [{ id: row.id, name: row.name, ...parsed.data }]
        : [];
    })
    .sort((a, b) => a.order - b.order);
  const touches = touchRows.slice(0, 500).flatMap((row) => {
    const parsed = journeyTouchSchema.safeParse(row.definition);
    return parsed.success
      ? [{ id: row.id, name: row.name, ...parsed.data }]
      : [];
  });
  const paths = pathRows.slice(0, 100).flatMap((row) => {
    const parsed = journeyPathSchema.safeParse(row.definition);
    return parsed.success ? [{ id: row.id, ...parsed.data }] : [];
  });
  const manage = session.capabilities.has("marketing.program.manage");
  return (
    <div className="min-w-0 space-y-5">
      <WorkspaceHeading
        eyebrow="Customer experience"
        title="Map the journey. Improve every moment."
        description="See the path from first awareness to a lasting relationship. Connect stages, capture customer intent and friction, and give every touchpoint an owner."
        actions={
          manage && (
            <CreateDialog title="Create a customer journey" label="New journey">
              <ActionForm action={createJourneyMap} label="Create journey">
                <Field name="name" label="Journey name" />
                <Field name="who" label="Who is this for?" />
                <Choice
                  name="campaignId"
                  label="Campaign (optional)"
                  optional
                  options={campaigns.map((campaign) => ({
                    value: campaign.id,
                    label: campaign.name,
                  }))}
                />
                <p className="text-xs text-slate-500">
                  Start with Awareness, Consideration, Decision, Purchase and
                  Retention. Rename and extend the stages to fit your customers.
                </p>
              </ActionForm>
            </CreateDialog>
          )
        }
      />
      <WorkspaceStats
        items={[
          { label: "Journey maps", value: maps.length, icon: Route },
          {
            label: "Stages",
            value: stages.length,
            hint: "In the selected map",
            icon: Users,
          },
          {
            label: "Touchpoints",
            value: touches.length,
            hint: "Customer interactions",
            icon: Touchpad,
          },
          {
            label: "Branches & return paths",
            value: paths.length,
            icon: GitBranch,
          },
        ]}
      />
      {!!maps.length && (
        <nav
          aria-label="Customer journey maps"
          className="flex flex-wrap gap-2"
        >
          {maps.map((map) => (
            <Link
              key={map.id}
              href={`/marketing/journey?focus=${map.id}`}
              aria-current={map.id === selected?.id ? "page" : undefined}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${map.id === selected?.id ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500"}`}
            >
              {map.name}
            </Link>
          ))}
        </nav>
      )}
      {selected ? (
        <JourneyCanvas
          key={selected.id}
          map={selected}
          stages={stages}
          touches={touches}
          paths={paths}
          campaignName={
            campaigns.find((campaign) => campaign.id === selected.campaignId)
              ?.name ?? null
          }
          canManage={manage}
        />
      ) : (
        <section className="rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Route size={25} />
          </span>
          <h3 className="mt-4 text-lg font-semibold">
            Design your first customer journey
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Start with the people you want to reach. Build the stages, add the
            touchpoints and map where customers need more help.
          </p>
        </section>
      )}
      {(touchRows.length > 500 || pathRows.length > 100) && (
        <p className="text-xs text-amber-700">
          This view shows up to 500 touchpoints and 100 branches. Split very
          large maps into focused customer journeys.
        </p>
      )}
      <p className="text-xs leading-relaxed text-slate-400">
        This map plans the customer experience.{" "}
        {session.capabilities.has("marketing.journey.read") && (
          <Link
            href="/marketing/journeys"
            className="font-medium text-blue-600"
          >
            Open journey automation
          </Link>
        )}{" "}
        for versioned waits, event conditions and goals.
      </p>
    </div>
  );
}
