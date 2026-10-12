import { assertStudioRuntimeFeatureEnabled, STUDIO_CONDITIONAL_FIELD_FEATURE } from "../runtime-features";

/** The supplied flag belongs to the freshly server-loaded company, never a
 * client request. Original Test coverage remains available while a first bridge
 * is deployed. Production activation requires immutable paired-reader evidence;
 * this grants no liveTest/native/private/field/reference authority. */
export function assertConditionalFieldActivationReady(company: { isTest: boolean }): void {
  if (!company.isTest) assertStudioRuntimeFeatureEnabled(STUDIO_CONDITIONAL_FIELD_FEATURE);
}
