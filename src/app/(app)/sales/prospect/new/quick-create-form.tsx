"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { checkProspectDuplicatesAction, createProspect } from "@/modules/sales/services/prospects";
import type { DuplicateCandidate } from "@/core/customers/duplicate-detection";

const SOURCES = ["Website enquiry", "Telephone", "Email", "Referral", "Existing customer", "Event", "Trade show", "Partner", "Outbound", "Campaign", "Social", "Imported", "Other"];

/** Same duplicate-protection pattern as Customer Master's quick-create: never
 *  blocks creation, only warns, with "Open existing" / "Create anyway" (§8,
 *  §12 — same canonical creation pipeline that checks for duplicates). */
export function ProspectQuickCreateForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (companyName.trim().length < 3) return;
    const timeout = setTimeout(async () => {
      const results = await checkProspectDuplicatesAction({ companyName, email: email || undefined });
      setDuplicates(results);
    }, 350);
    return () => clearTimeout(timeout);
  }, [companyName, email]);

  const effectiveDuplicates = companyName.trim().length < 3 ? [] : duplicates;
  const showWarning = effectiveDuplicates.length > 0 && !acknowledged;

  function handleCompanyChange(value: string) {
    setCompanyName(value);
    setAcknowledged(false);
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    const prospect = await createProspect({
      companyName: String(formData.get("companyName")),
      contactFirstName: String(formData.get("contactFirstName") || "") || undefined,
      contactSurname: String(formData.get("contactSurname") || "") || undefined,
      email: String(formData.get("email") || "") || undefined,
      phone: String(formData.get("phone") || "") || undefined,
      jobTitle: String(formData.get("jobTitle") || "") || undefined,
      website: String(formData.get("website") || "") || undefined,
      country: String(formData.get("country") || "") || undefined,
      source: String(formData.get("source") || "") || undefined,
    });
    router.push(`/sales/prospect/${prospect.id}`);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Company name" name="companyName" required value={companyName} onChange={handleCompanyChange} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-ink-muted)]">Source</span>
          <select name="source" className="rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm">
            <option value="">—</option>
            {SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact first name" name="contactFirstName" />
        <Field label="Contact surname" name="contactSurname" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Job title" name="jobTitle" />
        <Field label="Website" name="website" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" name="email" type="email" value={email} onChange={(value) => { setEmail(value); setAcknowledged(false); }} />
        <Field label="Telephone" name="phone" type="tel" />
      </div>
      <Field label="Country" name="country" />

      {showWarning && (
        <div className="rounded-[var(--radius-atlas-md)] border border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning-soft)] p-4">
          <p className="text-sm font-medium text-[var(--color-ink)]">This may already exist.</p>
          <ul className="mt-2 flex flex-col gap-1">
            {effectiveDuplicates.map((candidate) => (
              <li key={candidate.id} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ink-muted)]">
                  {candidate.name} · {candidate.customerCode}
                  {candidate.location ? ` · ${candidate.location}` : ""} · matched on {candidate.matchedOn}
                </span>
                <Link href={`/customers/${candidate.id}`} className="text-[var(--color-atlas-blue)] hover:underline">
                  Open existing
                </Link>
              </li>
            ))}
          </ul>
          <Button type="button" variant="secondary" className="mt-3" onClick={() => setAcknowledged(true)}>
            Create anyway
          </Button>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/sales/prospect")}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={showWarning || submitting}>
          {submitting ? "Creating…" : "Create prospect"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--color-ink-muted)]">{label}</span>
      {onChange ? (
        <input
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-atlas-blue)]"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className="rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-atlas-blue)]"
        />
      )}
    </label>
  );
}
