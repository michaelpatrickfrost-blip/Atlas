import type { StudioWidget } from "./definition";

export const dashboardLooks = [
  {
    id: "atlas",
    name: "Atlas blue",
    description: "Clear, bright and focused",
    colors: ["blue", "teal", "slate"],
    tone: "neutral",
  },
  {
    id: "garden",
    name: "Botanical",
    description: "Fresh greens and warm neutrals",
    colors: ["teal", "slate", "amber"],
    tone: "neutral",
  },
  {
    id: "prism",
    name: "Prism",
    description: "A little more personality",
    colors: ["violet", "rose", "blue"],
    tone: "neutral",
  },
  {
    id: "night",
    name: "After hours",
    description: "Deep blue, luminous charts",
    colors: ["blue", "teal", "violet"],
    tone: "ink",
  },
] as const;

export function applyDashboardLook(
  widgets: StudioWidget[],
  id: string,
): StudioWidget[] {
  const look = dashboardLooks.find((item) => item.id === id);
  if (!look) return widgets;
  return widgets.map((widget, index) => ({
    ...widget,
    color: look.colors[index % look.colors.length],
    tone: look.tone,
    borderless: false,
  }));
}

export function arrangeDashboard(
  widgets: StudioWidget[],
  layout: "balanced" | "spotlight" | "compact",
): StudioWidget[] {
  return widgets.map((widget, index) => ({
    ...widget,
    span:
      layout === "compact" ? 4 : layout === "spotlight" && index === 0 ? 12 : 6,
    height:
      layout === "compact" || widget.visual === "kpi" ? "compact" : "standard",
  }));
}
