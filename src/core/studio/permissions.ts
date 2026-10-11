export const STUDIO_CAPABILITIES = {
  read: "studio.definition.read",
  edit: "studio.definition.edit",
  publish: "studio.definition.publish",
} as const;

/** Deliberate grants only; exclude from standard roles and ordinary app presets. */
export const STUDIO_DATA_CAPABILITIES = {
  liveTest: "studio.test.live_data",
} as const;
