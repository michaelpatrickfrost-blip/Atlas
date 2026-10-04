export type AgreementWindow = {
  id: string;
  name: string;
  status: string;
  startsOn: Date;
  endsOn: Date | null;
  priceListId: string | null;
};

/** The active agreement that started most recently covers the customer. Drafts never price an order. */
export function chooseAgreement<T extends AgreementWindow>(agreements: T[], asOf: Date): T | undefined {
  return agreements
    .filter((agreement) => agreement.status === "ACTIVE" && agreement.startsOn.getTime() <= asOf.getTime() && (agreement.endsOn == null || agreement.endsOn.getTime() >= asOf.getTime()))
    .sort((a, b) => b.startsOn.getTime() - a.startsOn.getTime() || a.id.localeCompare(b.id))[0];
}

export function formatHours(minutes: number | null | undefined) {
  if (minutes == null) return "";
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${minutes} minutes`;
}

export function agreementLabel(status: string, endsOn: Date | null, asOf = new Date()) {
  if (status === "ACTIVE" && endsOn && endsOn.getTime() < asOf.getTime()) return { label: "Expired", tone: "warning" as const };
  if (status === "ACTIVE") return { label: "Active", tone: "success" as const };
  if (status === "ENDED") return { label: "Ended", tone: "neutral" as const };
  return { label: "Draft", tone: "neutral" as const };
}

export function dayStamp(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function parseDay(value: string, endOfDay: boolean) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Enter dates as YYYY-MM-DD.");
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a real date.");
  return date;
}

export function parseHours(value: string, label: string) {
  const text = value.trim();
  if (!text) return null;
  if (!/^\d+$/.test(text)) throw new Error(`${label} must be a whole number of hours.`);
  const hours = Number(text);
  if (hours < 1 || hours > 8760) throw new Error(`${label} must be between 1 and 8760 hours.`);
  return hours * 60;
}
