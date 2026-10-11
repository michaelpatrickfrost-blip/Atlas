import type { NativeValidationRequest } from "../registry/types";

/** Internal live owning operation, never a client flag or creation token. */
export type NativeFieldValidationAccess = {
  kind: "native_validation";
  request: NativeValidationRequest;
  operation: string;
  proof: object;
};
