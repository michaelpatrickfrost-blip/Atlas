export type RiskTone = "neutral" | "attention" | "stop";

export type RiskBand = { min: number; max: number; label: string; tone: RiskTone };

export type RiskMatrixConfig = {
  qualitative: boolean;
  likelihoodLabels: string[];
  severityLabels: string[];
  bands: RiskBand[];
};

export const DEFAULT_FIVE_BY_FIVE: RiskMatrixConfig = {
  qualitative: false,
  likelihoodLabels: ["Rare", "Unlikely", "Possible", "Likely", "Almost certain"],
  severityLabels: ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"],
  bands: [
    { min: 1, max: 4, label: "Low", tone: "neutral" },
    { min: 5, max: 9, label: "Medium", tone: "attention" },
    { min: 10, max: 16, label: "High", tone: "attention" },
    { min: 17, max: 25, label: "Critical", tone: "stop" },
  ],
};

export const THREE_BY_THREE: RiskMatrixConfig = {
  qualitative: false,
  likelihoodLabels: ["Low", "Medium", "High"],
  severityLabels: ["Low", "Medium", "High"],
  bands: [
    { min: 1, max: 2, label: "Low", tone: "neutral" },
    { min: 3, max: 4, label: "Medium", tone: "attention" },
    { min: 6, max: 9, label: "High", tone: "stop" },
  ],
};

export const FOUR_BY_FOUR: RiskMatrixConfig = {
  qualitative: false,
  likelihoodLabels: ["Rare", "Unlikely", "Likely", "Almost certain"],
  severityLabels: ["Minor", "Moderate", "Major", "Catastrophic"],
  bands: [
    { min: 1, max: 4, label: "Low", tone: "neutral" },
    { min: 5, max: 9, label: "Medium", tone: "attention" },
    { min: 10, max: 16, label: "High", tone: "stop" },
  ],
};

export const QUALITATIVE_MATRIX: RiskMatrixConfig = {
  qualitative: true,
  likelihoodLabels: [],
  severityLabels: [],
  bands: [
    { min: 0, max: 0, label: "Low", tone: "neutral" },
    { min: 0, max: 0, label: "Medium", tone: "attention" },
    { min: 0, max: 0, label: "High", tone: "stop" },
  ],
};

export function matrixSize(config: RiskMatrixConfig): 3 | 4 | 5 | "qualitative" {
  if (config.qualitative) return "qualitative";
  const size = config.likelihoodLabels.length;
  if (config.severityLabels.length !== size) throw new Error("Likelihood and severity scales must match.");
  if (size !== 3 && size !== 4 && size !== 5) throw new Error("A numeric matrix must be 3×3, 4×4 or 5×5.");
  return size;
}

export function explainRisk(
  config: RiskMatrixConfig,
  likelihood: number | null,
  severity: number | null,
  qualitativeLabel?: string | null,
): { score: number | null; label: string; tone: RiskTone; explanation: string } {
  if (config.qualitative) {
    const label = qualitativeLabel?.trim() ?? "";
    const band = config.bands.find((item) => item.label.toLowerCase() === label.toLowerCase());
    if (!band) throw new Error("Choose one of the configured qualitative ratings.");
    return {
      score: null,
      label: band.label,
      tone: band.tone,
      explanation: `Qualitative judgement recorded as ${band.label}. No numeric score was applied. A rating does not by itself prove the risk is adequately controlled.`,
    };
  }
  const size = matrixSize(config);
  if (typeof size !== "number") throw new Error("This matrix is qualitative.");
  if (likelihood == null || severity == null) throw new Error("Likelihood and severity are both required.");
  if (!Number.isInteger(likelihood) || !Number.isInteger(severity) || likelihood < 1 || severity < 1 || likelihood > size || severity > size) {
    throw new Error(`Scores must be whole numbers from 1 to ${size}.`);
  }
  const score = likelihood * severity;
  const band = config.bands.find((item) => score >= item.min && score <= item.max);
  if (!band) throw new Error(`No configured band covers a score of ${score}. The matrix cannot rate this combination until its bands are completed.`);
  const likelihoodLabel = config.likelihoodLabels[likelihood - 1];
  const severityLabel = config.severityLabels[severity - 1];
  return {
    score,
    label: band.label,
    tone: band.tone,
    explanation: `${likelihoodLabel} (${likelihood}) × ${severityLabel} (${severity}) = ${score}, rated ${band.label} on this matrix. The calculation explains the rating. It does not by itself prove the risk is adequately controlled.`,
  };
}
