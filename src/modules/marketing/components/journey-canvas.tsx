"use client";
import { useState } from "react";
import {
  GitBranch,
  LayoutGrid,
  Route,
  ZoomIn,
  ZoomOut,
  Smile,
  Meh,
  Frown,
  UserRound,
  Users,
  Target,
  Lightbulb,
  CircleAlert,
} from "lucide-react";
import type { z } from "zod";
import type {
  journeyStageSchema,
  journeyTouchSchema,
  journeyPathSchema,
} from "../domain/planning";
import { PLAN_CHANNELS } from "../domain/planning";
import { addJourneyStage, addJourneyTouch } from "../services/commands";
import {
  editJourneyStageForm as editJourneyStage,
  moveJourneyStageForm as moveJourneyStage,
  editJourneyTouchForm as editJourneyTouch,
  saveJourneyPathForm as saveJourneyPath,
} from "../services/journey-workspace";
import { ActionForm } from "./action-form";
import { CreateDialog } from "@/components/ui/create-dialog";
import { Button } from "@/components/ui/button";
import { channelClass } from "./format";

type Stage = z.infer<typeof journeyStageSchema> & { id: string; name: string };
type Touch = z.infer<typeof journeyTouchSchema> & { id: string; name: string };
type Path = z.infer<typeof journeyPathSchema> & { id: string };
type JourneyProps = {
  map: { id: string; name: string; who: string; updatedAt: string };
  stages: Stage[];
  touches: Touch[];
  paths: Path[];
  campaignName: string | null;
  canManage: boolean;
};
const field =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800";
const emotions = {
  UNKNOWN: { label: "Not researched", icon: Meh, tone: "text-slate-400" },
  POSITIVE: { label: "Positive", icon: Smile, tone: "text-emerald-600" },
  NEUTRAL: { label: "Neutral", icon: Meh, tone: "text-amber-600" },
  FRUSTRATED: { label: "Frustrated", icon: Frown, tone: "text-rose-600" },
};
function HiddenMap({ map }: { map: JourneyProps["map"] }) {
  return (
    <>
      <input name="journeyId" type="hidden" value={map.id} />
      <input name="expected" type="hidden" value={map.updatedAt} />
    </>
  );
}
function TextArea({
  name,
  label,
  value = "",
  max = 1000,
}: {
  name: string;
  label: string;
  value?: string;
  max?: number;
}) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <textarea
        name={name}
        defaultValue={value}
        maxLength={max}
        rows={3}
        className={field}
      />
    </label>
  );
}
function StageChoice({
  name,
  label,
  stages,
  value,
}: {
  name: string;
  label: string;
  stages: Stage[];
  value?: string;
}) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <select name={name} defaultValue={value} required className={field}>
        {stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function JourneyCanvas({
  map,
  stages,
  touches,
  paths,
  campaignName,
  canManage,
}: JourneyProps) {
  const [selectedId, setSelectedId] = useState(stages[0]?.id ?? ""),
    [view, setView] = useState("flow"),
    [zoom, setZoom] = useState(1);
  const selected = stages.find((stage) => stage.id === selectedId),
    selectedTouches = touches.filter((touch) => touch.stageId === selectedId);
  const width = Math.max(720, stages.length * 304 + 96),
    height = 650 + Math.min(8, paths.length) * 24;
  const nodeX = (id: string) =>
    48 + stages.findIndex((stage) => stage.id === id) * 304;
  const validPaths = paths.filter(
    (path) =>
      stages.some((stage) => stage.id === path.fromStageId) &&
      stages.some((stage) => stage.id === path.toStageId),
  );
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <p className="text-xs font-medium text-blue-600">
            {campaignName ?? "Customer experience plan"}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">
            {map.name}
          </h3>
          <p className="mt-2 text-sm text-slate-500">For {map.who}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: "flow", label: "Flow", icon: Route },
            { value: "lanes", label: "Experience map", icon: LayoutGrid },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${view === value ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-500"}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
          {canManage && (
            <CreateDialog
              title="Add a journey stage"
              label="Add stage"
              variant="secondary"
            >
              <ActionForm action={addJourneyStage} label="Add stage">
                <input type="hidden" name="journeyId" value={map.id} />
                <label className="block text-xs font-medium">
                  Stage name
                  <input
                    name="name"
                    required
                    maxLength={250}
                    className={field}
                  />
                </label>
                <TextArea
                  name="customerIntent"
                  label="What is the customer trying to do?"
                  max={500}
                />
              </ActionForm>
            </CreateDialog>
          )}
        </div>
      </div>
      <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 border-b border-slate-100 xl:border-r xl:border-b-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">
              Select a stage to explore and improve it.
            </p>
            {view === "flow" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Zoom out journey"
                  disabled={zoom <= 0.5}
                  onClick={() =>
                    setZoom((value) => Math.max(0.5, value - 0.25))
                  }
                  className="rounded-lg p-1.5 text-slate-500 disabled:opacity-30"
                >
                  <ZoomOut size={17} />
                </button>
                <span className="text-xs text-slate-400">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  aria-label="Zoom in journey"
                  disabled={zoom >= 1.5}
                  onClick={() =>
                    setZoom((value) => Math.min(1.5, value + 0.25))
                  }
                  className="rounded-lg p-1.5 text-slate-500 disabled:opacity-30"
                >
                  <ZoomIn size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="text-xs text-blue-600"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
          <div
            aria-label="Customer journey canvas"
            className="max-h-[820px] min-w-0 overflow-auto bg-slate-50"
            style={{
              backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {view === "flow" ? (
              <div style={{ width: width * zoom, height: height * zoom }}>
                <div
                  className="relative origin-top-left"
                  style={{ width, height, transform: `scale(${zoom})` }}
                >
                  <svg
                    width={width}
                    height={height}
                    className="pointer-events-none absolute inset-0"
                    aria-label="Journey connections"
                  >
                    <defs>
                      <marker
                        id="journey-arrow"
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="4"
                        orient="auto"
                      >
                        <path d="M0,0 L8,4 L0,8" fill="#60a5fa" />
                      </marker>
                      <marker
                        id="journey-branch"
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="4"
                        orient="auto"
                      >
                        <path d="M0,0 L8,4 L0,8" fill="#8b5cf6" />
                      </marker>
                    </defs>
                    {stages.slice(0, -1).map((stage) => (
                      <path
                        key={stage.id}
                        d={`M ${nodeX(stage.id) + 272} 175 H ${nodeX(stage.id) + 299}`}
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        markerEnd="url(#journey-arrow)"
                      />
                    ))}
                    {validPaths.map((path, index) => {
                      const start = nodeX(path.fromStageId) + 136,
                        end = nodeX(path.toStageId) + 136,
                        y = 50 + (index % 5) * 15;
                      return (
                        <g key={path.id}>
                          <path
                            d={`M ${start} 150 C ${start} ${y}, ${end} ${y}, ${end} 145`}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2"
                            strokeDasharray={
                              path.kind === "RETURN" ? "5 4" : undefined
                            }
                            markerEnd="url(#journey-branch)"
                          />
                          <text
                            x={(start + end) / 2}
                            y={y + 7}
                            textAnchor="middle"
                            fill="#7c3aed"
                            fontSize="11"
                            paintOrder="stroke"
                            stroke="#f8fafc"
                            strokeWidth="5"
                            strokeLinejoin="round"
                          >
                            {path.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  {stages.map((stage, index) => {
                    const emotion = emotions[stage.emotion],
                      Icon = emotion.icon,
                      points = touches.filter(
                        (touch) => touch.stageId === stage.id,
                      );
                    return (
                      <article
                        key={stage.id}
                        data-journey-stage={stage.id}
                        className={`absolute w-[272px] overflow-hidden rounded-2xl border bg-white shadow-sm ${selectedId === stage.id ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}
                        style={{ left: nodeX(stage.id), top: 150 }}
                      >
                        <button
                          type="button"
                          aria-pressed={selectedId === stage.id}
                          onClick={() => setSelectedId(stage.id)}
                          className="block w-full bg-gradient-to-br from-blue-50 to-white p-4 text-left"
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">
                            Stage {index + 1}
                          </span>
                          <span className="mt-2 block text-lg font-semibold text-slate-900">
                            {stage.name}
                          </span>
                          <span className="mt-2 block text-xs leading-relaxed text-slate-500">
                            {stage.customerIntent ||
                              "Add the customer’s intent"}
                          </span>
                          <span
                            className={`mt-3 inline-flex items-center gap-1.5 text-xs ${emotion.tone}`}
                          >
                            <Icon size={15} />
                            {emotion.label}
                          </span>
                        </button>
                        <div className="space-y-2 border-t border-slate-100 p-3">
                          {points.slice(0, 3).map((touch) => (
                            <button
                              key={touch.id}
                              type="button"
                              onClick={() => setSelectedId(stage.id)}
                              className="w-full rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-left"
                            >
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${channelClass(touch.channel)}`}
                              >
                                {touch.channel}
                              </span>
                              <span className="mt-2 block text-xs font-semibold text-slate-700">
                                {touch.name}
                              </span>
                              {touch.owner && (
                                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400">
                                  <UserRound size={11} />
                                  {touch.owner}
                                </span>
                              )}
                            </button>
                          ))}
                          {!points.length && (
                            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-400">
                              Add the first touchpoint
                            </p>
                          )}
                          {points.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setSelectedId(stage.id)}
                              className="w-full text-xs font-medium text-blue-600"
                            >
                              + {points.length - 3} more touchpoints
                            </button>
                          )}
                          {stage.painPoint && (
                            <p className="flex items-start gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                              <CircleAlert
                                size={13}
                                className="mt-0.5 shrink-0"
                              />
                              <span className="line-clamp-2">
                                {stage.painPoint}
                              </span>
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                className="grid gap-3 p-5"
                style={{
                  gridTemplateColumns: `150px repeat(${Math.max(1, stages.length)}, 240px)`,
                  width: Math.max(700, 170 + stages.length * 252),
                }}
              >
                <div className="self-end text-xs font-semibold text-slate-400">
                  Customer experience
                </div>
                {stages.map((stage) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedId(stage.id)}
                    className={`rounded-xl border p-4 text-left text-sm font-semibold ${selectedId === stage.id ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white"}`}
                  >
                    {stage.name}
                  </button>
                ))}
                {[
                  {
                    label: "Customer intent",
                    icon: Users,
                    field: "customerIntent",
                  },
                  { label: "Feeling", icon: Smile, field: "emotion" },
                  { label: "Touchpoints", icon: Route, field: "touches" },
                  { label: "Friction", icon: CircleAlert, field: "painPoint" },
                  {
                    label: "Improvement",
                    icon: Lightbulb,
                    field: "opportunity",
                  },
                  {
                    label: "Success measure",
                    icon: Target,
                    field: "successMeasure",
                  },
                ].map(({ label, icon: Icon, field: key }) => (
                  <Row key={key} label={label} icon={Icon}>
                    {stages.map((stage) => (
                      <div
                        key={stage.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600"
                      >
                        {key === "touches"
                          ? touches
                              .filter((touch) => touch.stageId === stage.id)
                              .map((touch) => (
                                <p key={touch.id} className="mb-2">
                                  {touch.name} · {touch.channel}
                                </p>
                              ))
                          : key === "emotion"
                            ? emotions[stage.emotion].label
                            : stage[
                                key as
                                  | "customerIntent"
                                  | "painPoint"
                                  | "opportunity"
                                  | "successMeasure"
                              ] || (
                                <span className="text-slate-300">
                                  To research
                                </span>
                              )}
                      </div>
                    ))}
                  </Row>
                ))}
              </div>
            )}
          </div>
        </div>
        <aside
          className="min-w-0 bg-white p-5"
          aria-label="Journey stage details"
        >
          {selected ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Selected stage
                </p>
                <h3 className="mt-2 text-lg font-semibold">{selected.name}</h3>
              </div>
              {canManage ? (
                <>
                  <details
                    open
                    key={`${selected.id}:${map.updatedAt}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <summary className="cursor-pointer text-sm font-semibold">
                      Customer experience
                    </summary>
                    <div className="mt-4">
                      <ActionForm action={editJourneyStage} label="Save stage">
                        <HiddenMap map={map} />
                        <input name="id" type="hidden" value={selected.id} />
                        <label className="block text-xs font-medium">
                          Stage name
                          <input
                            name="name"
                            defaultValue={selected.name}
                            required
                            maxLength={250}
                            className={field}
                          />
                        </label>
                        <TextArea
                          name="customerIntent"
                          label="Customer intent"
                          value={selected.customerIntent}
                          max={500}
                        />
                        <label className="block text-xs font-medium">
                          How do they feel?
                          <select
                            name="emotion"
                            defaultValue={selected.emotion}
                            className={field}
                          >
                            {Object.entries(emotions).map(
                              ([value, emotion]) => (
                                <option key={value} value={value}>
                                  {emotion.label}
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                        <TextArea
                          name="painPoint"
                          label="Friction / pain point"
                          value={selected.painPoint}
                        />
                        <TextArea
                          name="opportunity"
                          label="How can we improve this?"
                          value={selected.opportunity}
                        />
                        <TextArea
                          name="successMeasure"
                          label="What would success look like?"
                          value={selected.successMeasure}
                          max={500}
                        />
                      </ActionForm>
                    </div>
                  </details>
                  <div className="flex gap-3">
                    {["left", "right"].map((direction) => (
                      <ActionForm
                        key={direction}
                        action={moveJourneyStage}
                        label={
                          direction === "left" ? "Move earlier" : "Move later"
                        }
                      >
                        <HiddenMap map={map} />
                        <input name="id" type="hidden" value={selected.id} />
                        <input
                          name="direction"
                          type="hidden"
                          value={direction}
                        />
                      </ActionForm>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                  <p>{selected.customerIntent}</p>
                  <p>{emotions[selected.emotion].label}</p>
                  {selected.painPoint && (
                    <p>
                      <strong>Friction:</strong> {selected.painPoint}
                    </p>
                  )}
                  {selected.opportunity && (
                    <p>
                      <strong>Improvement:</strong> {selected.opportunity}
                    </p>
                  )}
                  {selected.successMeasure && (
                    <p>
                      <strong>Success:</strong> {selected.successMeasure}
                    </p>
                  )}
                </div>
              )}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    Touchpoints{" "}
                    <span className="font-normal text-slate-400">
                      {selectedTouches.length}
                    </span>
                  </h4>
                  {canManage && (
                    <CreateDialog
                      title="Add a touchpoint"
                      label="Add touchpoint"
                      variant="secondary"
                    >
                      <ActionForm
                        action={addJourneyTouch}
                        label="Add touchpoint"
                      >
                        <StageChoice
                          name="stageId"
                          label="Stage"
                          stages={stages}
                          value={selected.id}
                        />
                        <TouchFields />
                      </ActionForm>
                    </CreateDialog>
                  )}
                </div>
                {selectedTouches.map((touch) => (
                  <details
                    key={`${touch.id}:${map.updatedAt}`}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <summary className="cursor-pointer text-sm font-medium">
                      {touch.name}
                      <span className="mt-1 block text-xs font-normal text-slate-400">
                        {touch.channel} · {touch.owner || "No owner yet"}
                      </span>
                    </summary>
                    <div className="mt-3">
                      {canManage ? (
                        <ActionForm
                          action={editJourneyTouch}
                          label="Save touchpoint"
                        >
                          <HiddenMap map={map} />
                          <input name="id" type="hidden" value={touch.id} />
                          <StageChoice
                            name="stageId"
                            label="Stage"
                            stages={stages}
                            value={touch.stageId}
                          />
                          <TouchFields touch={touch} />
                          <Button
                            type="submit"
                            name="remove"
                            value="yes"
                            formNoValidate
                            variant="ghost"
                          >
                            Remove touchpoint
                          </Button>
                        </ActionForm>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm text-slate-500">
                          {touch.moment}
                        </p>
                      )}
                    </div>
                  </details>
                ))}
                {!selectedTouches.length && (
                  <p className="text-xs text-slate-400">
                    No touchpoints for this stage yet.
                  </p>
                )}
              </section>
              <section className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <GitBranch size={15} className="text-violet-600" />
                  Branches & return paths
                </h4>
                {validPaths
                  .filter((path) => path.fromStageId === selected.id)
                  .map((path) => (
                    <div key={path.id} className="rounded-xl bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-700">
                        {path.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        →{" "}
                        {
                          stages.find((stage) => stage.id === path.toStageId)
                            ?.name
                        }
                      </p>
                      {canManage && (
                        <ActionForm
                          action={saveJourneyPath}
                          label="Remove path"
                        >
                          <HiddenMap map={map} />
                          <input name="id" type="hidden" value={path.id} />
                          <input name="remove" type="hidden" value="yes" />
                        </ActionForm>
                      )}
                    </div>
                  ))}
                {canManage && stages.length > 1 && (
                  <CreateDialog
                    title="Connect journey stages"
                    label="Add a branch or return path"
                    variant="secondary"
                  >
                    <ActionForm action={saveJourneyPath} label="Connect stages">
                      <HiddenMap map={map} />
                      <StageChoice
                        name="fromStageId"
                        label="From stage"
                        stages={stages}
                        value={selected.id}
                      />
                      <StageChoice
                        name="toStageId"
                        label="To stage"
                        stages={stages.filter(
                          (stage) => stage.id !== selected.id,
                        )}
                      />
                      <label className="block text-xs font-medium">
                        Path label / condition
                        <input
                          name="label"
                          required
                          maxLength={150}
                          placeholder="e.g. Needs more information"
                          className={field}
                        />
                      </label>
                      <label className="block text-xs font-medium">
                        Path type
                        <select name="kind" className={field}>
                          <option value="BRANCH">Alternative path</option>
                          <option value="RETURN">Return / follow-up</option>
                        </select>
                      </label>
                      <p className="text-xs text-slate-500">
                        Describe the path customers take. Automation rules are
                        set separately in Journey automation.
                      </p>
                    </ActionForm>
                  </CreateDialog>
                )}
              </section>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Add a stage to start mapping the experience.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
function Row({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex items-start gap-2 py-4 text-xs font-semibold text-slate-500">
        <Icon size={16} />
        {label}
      </div>
      {children}
    </>
  );
}
function TouchFields({ touch }: { touch?: Touch }) {
  return (
    <>
      <label className="block text-xs font-medium">
        Touchpoint name
        <input
          name="name"
          required
          maxLength={250}
          defaultValue={touch?.name}
          className={field}
        />
      </label>
      <label className="block text-xs font-medium">
        Channel
        <select
          name="channel"
          defaultValue={touch?.channel ?? "Email"}
          className={field}
        >
          {PLAN_CHANNELS.map((channel) => (
            <option key={channel}>{channel}</option>
          ))}
        </select>
      </label>
      <TextArea
        name="moment"
        label="What happens at this moment?"
        value={touch?.moment}
        max={500}
      />
      <label className="block text-xs font-medium">
        Owner
        <input
          name="owner"
          maxLength={250}
          defaultValue={touch?.owner}
          placeholder="Person or team"
          className={field}
        />
      </label>
    </>
  );
}
