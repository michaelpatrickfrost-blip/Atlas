"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES, validateJourney } from "../domain/policy";
import type { z } from "zod";
import type { journeyNodes } from "../domain/policy";
import {
  Clock3,
  GitBranch,
  Target,
  Flag,
  ArrowDown,
  Plus,
  X,
} from "lucide-react";
const style = "rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm";
export function AudienceBuilder() {
  const [join, setJoin] = useState("all");
  const [rows, setRows] = useState([
    { field: "country", operator: "eq", value: "GB" },
  ]);
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-sm font-medium">People who match</legend>
      <select
        aria-label="Match rule groups"
        className={style}
        value={join}
        onChange={(e) => setJoin(e.target.value)}
      >
        <option value="all">All conditions (AND)</option>
        <option value="any">Any condition (OR)</option>
      </select>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <select
            aria-label={`Condition ${i + 1} field`}
            className={style}
            value={r.field}
            onChange={(e) =>
              setRows(
                rows.map((x, j) =>
                  j === i ? { ...x, field: e.target.value } : x,
                ),
              )
            }
          >
            {["country", "lifecycle", "score", "source", "brand", "event"].map(
              (f) => (
                <option key={f}>{f}</option>
              ),
            )}
          </select>
          <select
            aria-label={`Condition ${i + 1} comparison`}
            className={style}
            value={r.operator}
            onChange={(e) =>
              setRows(
                rows.map((x, j) =>
                  j === i ? { ...x, operator: e.target.value } : x,
                ),
              )
            }
          >
            {[
              ["eq", "is"],
              ["neq", "is not"],
              ["gte", "at least"],
              ["lte", "at most"],
              ["contains", "contains"],
              ["exists", "did event"],
              ["absent", "did not do event"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <input
            aria-label={`Condition ${i + 1} value`}
            className={`${style} col-span-2`}
            value={r.value}
            onChange={(e) =>
              setRows(
                rows.map((x, j) =>
                  j === i ? { ...x, value: e.target.value } : x,
                ),
              )
            }
          />
          {rows.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRows(rows.filter((_, j) => i !== j))}
            >
              Remove
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        onClick={() =>
          setRows([...rows, { field: "score", operator: "gte", value: "0" }])
        }
      >
        Add condition
      </Button>
      <input
        type="hidden"
        name="rules"
        value={JSON.stringify({
          [join]: rows.map((r) => ({
            ...r,
            value: r.field === "score" ? Number(r.value) : r.value,
          })),
        })}
      />
    </fieldset>
  );
}
type JourneyNode = z.infer<typeof journeyNodes>[number];
function initialPath(value?: unknown): JourneyNode[] {
  try {
    return value
      ? validateJourney(value)
      : [{ kind: "WAIT", hours: 72 }, { kind: "END" }];
  } catch {
    return [{ kind: "WAIT", hours: 72 }, { kind: "END" }];
  }
}
const nodeIcons = { WAIT: Clock3, BRANCH: GitBranch, GOAL: Target, END: Flag };
const human = (value: string) => value.toLowerCase().replaceAll("_", " ");
export function JourneyPreview({ nodes: value }: { nodes: unknown }) {
  let nodes: JourneyNode[];
  try {
    nodes = validateJourney(value);
  } catch {
    return (
      <p className="text-sm text-amber-700">
        This version needs a valid journey path before it can be published.
      </p>
    );
  }
  return (
    <ol aria-label="Automation flow" className="space-y-2">
      {nodes.map((node, index) => {
        const Icon = nodeIcons[node.kind];
        return (
          <li key={index}>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <span
                className={`rounded-lg p-2 ${node.kind === "BRANCH" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"}`}
              >
                <Icon size={17} />
              </span>
              <div>
                <p className="text-xs font-semibold capitalize">
                  {index + 1} · {human(node.kind)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {node.kind === "WAIT"
                    ? `${node.hours} hours`
                    : node.kind === "END"
                      ? "Finish this journey"
                      : human(node.event)}
                </p>
                {node.kind === "BRANCH" && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
                      Matched → Step {node.yes + 1}
                    </span>
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                      Not matched → Step {node.no + 1}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {index < nodes.length - 1 && (
              <ArrowDown size={13} className="mx-auto mt-2 text-slate-300" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
export function JourneyBuilder({
  initialNodes,
}: { initialNodes?: unknown } = {}) {
  const [nodes, setNodes] = useState<JourneyNode[]>(() =>
    initialPath(initialNodes),
  );
  const [message, setMessage] = useState("");
  const insert = (after: number, kind: "WAIT" | "GOAL" | "BRANCH") => {
    if (nodes.length >= 50) return;
    const position = after + 1;
    const shifted = nodes.map((node) =>
      node.kind === "BRANCH"
        ? {
            ...node,
            yes: node.yes >= position ? node.yes + 1 : node.yes,
            no: node.no >= position ? node.no + 1 : node.no,
          }
        : node,
    );
    const node: JourneyNode =
      kind === "WAIT"
        ? { kind, hours: 24 }
        : kind === "GOAL"
          ? { kind, event: "PURCHASE_COMPLETED" }
          : {
              kind,
              event: "EMAIL_CLICKED",
              yes: position + 1,
              no: shifted.length,
            };
    shifted.splice(position, 0, node);
    setNodes(shifted);
    setMessage("");
  };
  const remove = (index: number) => {
    if (
      nodes.some(
        (node) =>
          node.kind === "BRANCH" && (node.yes === index || node.no === index),
      )
    ) {
      setMessage(
        "Change any branches pointing to this step before removing it.",
      );
      return;
    }
    setNodes(
      nodes
        .filter((_, i) => i !== index)
        .map((node) =>
          node.kind === "BRANCH"
            ? {
                ...node,
                yes: node.yes > index ? node.yes - 1 : node.yes,
                no: node.no > index ? node.no - 1 : node.no,
              }
            : node,
        ),
    );
    setMessage("");
  };
  const patch = (index: number, node: JourneyNode) =>
    setNodes(nodes.map((old, i) => (i === index ? node : old)));
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">Visual automation flow</legend>
      <p className="text-xs leading-relaxed text-slate-500">
        Wait, branch on a recorded event, check a goal and finish. Branches
        point to later steps; contacts stay on their published version.
      </p>
      {nodes.map((node, index) => {
        const Icon = nodeIcons[node.kind],
          final = index === nodes.length - 1;
        return (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <Icon
                size={16}
                className={
                  node.kind === "BRANCH" ? "text-violet-600" : "text-blue-600"
                }
              />
              <span className="text-xs font-semibold">Step {index + 1}</span>
              {!final && (
                <button
                  type="button"
                  aria-label={`Remove step ${index + 1}`}
                  onClick={() => remove(index)}
                  className="ml-auto rounded-lg p-1 text-slate-400"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {final ? (
              <p className="mt-2 text-sm text-slate-500">End journey</p>
            ) : (
              <>
                <label className="mt-3 block text-xs font-medium">
                  Action
                  <select
                    aria-label={`Step ${index + 1} kind`}
                    className={`${style} mt-1 w-full`}
                    value={node.kind}
                    onChange={(event) =>
                      patch(
                        index,
                        event.target.value === "WAIT"
                          ? { kind: "WAIT", hours: 24 }
                          : event.target.value === "GOAL"
                            ? { kind: "GOAL", event: "PURCHASE_COMPLETED" }
                            : {
                                kind: "BRANCH",
                                event: "EMAIL_CLICKED",
                                yes: index + 1,
                                no: nodes.length - 1,
                              },
                      )
                    }
                  >
                    <option value="WAIT">Wait</option>
                    <option value="BRANCH">Branch on an event</option>
                    <option value="GOAL">Check a goal</option>
                  </select>
                </label>
                {node.kind === "WAIT" && (
                  <label className="mt-3 block text-xs font-medium">
                    Wait in hours
                    <input
                      aria-label={`Step ${index + 1} wait hours`}
                      className={`${style} mt-1 w-full`}
                      type="number"
                      min={1}
                      max={8760}
                      value={node.hours}
                      onChange={(event) =>
                        patch(index, {
                          kind: "WAIT",
                          hours: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                )}
                {(node.kind === "GOAL" || node.kind === "BRANCH") && (
                  <label className="mt-3 block text-xs font-medium">
                    Recorded event
                    <select
                      aria-label={`Step ${index + 1} event`}
                      className={`${style} mt-1 w-full`}
                      value={node.event}
                      onChange={(event) =>
                        patch(index, {
                          ...node,
                          event: event.target.value as typeof node.event,
                        })
                      }
                    >
                      {EVENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {human(type)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {node.kind === "BRANCH" && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(["yes", "no"] as const).map((key) => (
                      <label key={key} className="text-xs font-medium">
                        {key === "yes" ? "If matched" : "If not matched"}
                        <select
                          aria-label={`Step ${index + 1} ${key === "yes" ? "matched" : "unmatched"} path`}
                          className={`${style} mt-1 w-full`}
                          value={node[key]}
                          onChange={(event) =>
                            patch(index, {
                              ...node,
                              [key]: Number(event.target.value),
                            })
                          }
                        >
                          {nodes.map((next, i) =>
                            i > index ? (
                              <option key={i} value={i}>
                                Step {i + 1} · {human(next.kind)}
                              </option>
                            ) : null,
                          )}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}
            {!final && nodes.length < 50 && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {(["WAIT", "BRANCH", "GOAL"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => insert(index, kind)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1.5 text-[10px] font-medium text-blue-700"
                  >
                    <Plus size={11} />
                    Add {human(kind)}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {message && (
        <p role="alert" className="text-xs text-amber-700">
          {message}
        </p>
      )}
      <input name="nodes" type="hidden" value={JSON.stringify(nodes)} />
    </fieldset>
  );
}
