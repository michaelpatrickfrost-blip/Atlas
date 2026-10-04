/** Safety decisions other modules may consume. Core defines the contract.
 *  The Safety module supplies the implementation. A missing or disabled Safety
 *  module means the caller keeps its own behaviour. */

export type SafetyAvailability = {
  available: boolean;
  status: "AVAILABLE" | "DO_NOT_USE" | "RESTRICTED";
  reason?: string;
  holdId?: string;
  label?: string;
};

export type SafetyAuthorisation = {
  authorised: boolean;
  reason?: string;
  expiredOn?: string;
};

export type SafetyDeliveryRisk = {
  holdId: string;
  summary: string;
  href: string;
};

export type SafetySubstanceGate = {
  approved: boolean;
  reason?: string;
};

export type SafetyHoldNotice = {
  id: string;
  label: string;
  reason: string;
  href: string;
  targetType: string;
  targetId: string;
};

export type SafetyProvider = {
  activeHolds(organisationId: string): Promise<SafetyHoldNotice[]>;
  resourceStatus(organisationId: string, resourceId: string): Promise<SafetyAvailability>;
  assetStatus(organisationId: string, assetRef: string): Promise<SafetyAvailability>;
  authoriseOperator(organisationId: string, userId: string, competenceKey: string | null): Promise<SafetyAuthorisation>;
  deliveryRisks(organisationId: string, salesOrderId: string): Promise<SafetyDeliveryRisk[]>;
  substanceStatus(organisationId: string, substanceId: string): Promise<SafetySubstanceGate>;
};
