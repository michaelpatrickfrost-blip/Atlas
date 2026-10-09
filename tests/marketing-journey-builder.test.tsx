// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { JourneyBuilder } from "@/modules/marketing/components/builders";
import { validateJourney } from "@/modules/marketing/domain/policy";
import {
  journeyStageSchema,
  journeyPathSchema,
} from "@/modules/marketing/domain/planning";
afterEach(cleanup);
it("adds a visual branch and preserves forward targets when another step is inserted", () => {
  const { container } = render(
    <JourneyBuilder
      initialNodes={[
        { kind: "WAIT", hours: 24 },
        { kind: "WAIT", hours: 48 },
        { kind: "END" },
      ]}
    />,
  );
  fireEvent.click(screen.getAllByRole("button", { name: "Add branch" })[0]);
  expect(screen.getByLabelText("Step 2 matched path")).toBeTruthy();
  let nodes = validateJourney(
    JSON.parse(
      (container.querySelector('input[name="nodes"]') as HTMLInputElement)
        .value,
    ),
  );
  expect(nodes[1]).toEqual({
    kind: "BRANCH",
    event: "EMAIL_CLICKED",
    yes: 2,
    no: 3,
  });
  fireEvent.click(screen.getAllByRole("button", { name: "Add wait" })[1]);
  nodes = validateJourney(
    JSON.parse(
      (container.querySelector('input[name="nodes"]') as HTMLInputElement)
        .value,
    ),
  );
  expect(nodes[1]).toEqual({
    kind: "BRANCH",
    event: "EMAIL_CLICKED",
    yes: 3,
    no: 4,
  });
  fireEvent.click(screen.getByRole("button", { name: "Remove step 4" }));
  expect(screen.getByRole("alert").textContent).toContain("branches pointing");
});
it("reads historical stages with safe empty research fields and rejects cross-shape metadata", () => {
  const historical = journeyStageSchema.parse({
    journeyId: "journey",
    order: 0,
    customerIntent: "Compare suppliers",
  });
  expect(historical.emotion).toBe("UNKNOWN");
  expect(historical.painPoint).toBe("");
  expect(
    journeyStageSchema.safeParse({ ...historical, emotion: "DELIGHTED" })
      .success,
  ).toBe(false);
  expect(
    journeyPathSchema.safeParse({
      journeyId: "journey",
      fromStageId: "same",
      toStageId: "same",
      label: "Loop",
      kind: "RETURN",
    }).success,
  ).toBe(false);
});
