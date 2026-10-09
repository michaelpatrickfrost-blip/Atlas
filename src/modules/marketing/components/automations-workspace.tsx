import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { Route } from "lucide-react";
import { WorkspaceHeading } from "@/components/ui/workspace";
import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "./action-form";
import { JourneyBuilder, JourneyPreview } from "./builders";
import { Field, Choice } from "./fields";
import { EVENT_TYPES } from "../domain/policy";
import {
  createJourney,
  reviseJourney,
  publishJourney,
  processJourneySteps,
} from "../services/commands";
export async function AutomationsWorkspace({ session }: { session: Session }) {
  const journeys = await db.marketingJourney.findMany({
    where: { organisationId: session.organisationId },
    include: {
      versions: {
        where: { organisationId: session.organisationId },
        orderBy: { number: "desc" },
        take: 10,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const manage = session.capabilities.has("marketing.journey.manage");
  return (
    <div className="space-y-5">
      <WorkspaceHeading
        eyebrow="Journey automation"
        title="A clear path for every contact"
        description="Design versioned waits, event branches and goals. Publish a reviewed version, then process its due steps. Channel delivery and automatic scheduling need a connected provider."
        actions={
          manage && (
            <CreateDialog
              title="Build an automation journey"
              label="New automation"
            >
              <ActionForm action={createJourney} label="Save draft">
                <Field name="name" label="Journey name" />
                <Choice
                  name="trigger"
                  label="Entry event"
                  options={EVENT_TYPES.map((value) => ({
                    value,
                    label: value.toLowerCase().replaceAll("_", " "),
                  }))}
                />
                <JourneyBuilder />
                <Choice
                  name="exitRule"
                  label="Exit when"
                  options={[
                    {
                      value: "PURCHASE_COMPLETED",
                      label: "A purchase is completed",
                    },
                    { value: "NONE", label: "The journey reaches its end" },
                  ]}
                />
              </ActionForm>
            </CreateDialog>
          )
        }
      />
      {manage && (
        <details className="rounded-2xl border border-slate-200 bg-white p-5">
          <summary className="cursor-pointer text-sm font-semibold">
            Process due steps
          </summary>
          <p className="my-3 text-xs leading-relaxed text-slate-500">
            Advance eligible contacts through saved waits, branches and goals.
            This does not send customer messages.
          </p>
          <ActionForm action={processJourneySteps} label="Process due steps" />
        </details>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {journeys.map((journey) => {
          const latest = journey.versions[0];
          return (
            <section
              key={journey.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-4">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600">
                  <Route size={15} />
                  {journey.status.toLowerCase()} · Draft V{latest?.number ?? 1}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{journey.name}</h3>
                <p className="mt-2 text-xs text-slate-500">
                  Entry: {journey.trigger.toLowerCase().replaceAll("_", " ")}
                  {journey.publishedVersion
                    ? ` · Published V${journey.publishedVersion}`
                    : ""}
                </p>
              </div>
              <JourneyPreview nodes={latest?.nodes} />
              {session.capabilities.has("marketing.journey.publish") &&
                latest &&
                latest.number !== journey.publishedVersion && (
                  <div className="mt-4">
                    <ActionForm
                      action={publishJourney}
                      label={`Publish V${latest.number}`}
                    >
                      <input name="id" type="hidden" value={journey.id} />
                    </ActionForm>
                  </div>
                )}
              {manage && (
                <details className="mt-4 border-t border-slate-100 pt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-blue-600">
                    Design the next version
                  </summary>
                  <div className="mt-4">
                    <ActionForm action={reviseJourney} label="Save new version">
                      <input name="id" type="hidden" value={journey.id} />
                      <JourneyBuilder
                        key={latest?.number}
                        initialNodes={latest?.nodes}
                      />
                      <Choice
                        name="exitRule"
                        label="Exit when"
                        value={latest?.exitRule}
                        options={[
                          {
                            value: "PURCHASE_COMPLETED",
                            label: "A purchase is completed",
                          },
                          {
                            value: "NONE",
                            label: "The journey reaches its end",
                          },
                        ]}
                      />
                    </ActionForm>
                  </div>
                </details>
              )}
            </section>
          );
        })}
      </div>
      {!journeys.length && (
        <p className="rounded-2xl border border-dashed border-blue-200 bg-white p-8 text-center text-sm text-slate-500">
          Create your first automation with an entry event, a wait and a goal.
        </p>
      )}
    </div>
  );
}
