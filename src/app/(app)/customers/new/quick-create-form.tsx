"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { checkForDuplicatesAction, createCustomerAction } from "@/core/customers/actions";
import type { DuplicateCandidate } from "@/core/customers/duplicate-detection";

/** Quick create: company name, country, primary contact, email/phone, account
 *  manager — nothing more (§34). Debounced duplicate check runs as the name is
 *  typed; it never blocks creation, only warns (§8). */
export function QuickCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (name.trim().length < 3) return;
    const timeout = setTimeout(async () => {
      const results = await checkForDuplicatesAction({ name, email: email || undefined });
      setDuplicates(results);
    }, 350);
    return () => clearTimeout(timeout);
  }, [name, email]);

  const effectiveDuplicates = name.trim().length < 3 ? [] : duplicates;

  function handleNameChange(value: string) {
    setName(value);
    setAcknowledged(false);
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setAcknowledged(false);
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    await createCustomerAction({
      name: String(formData.get("name")),
      kind: (formData.get("kind") as "COMPANY" | "PERSON") ?? "COMPANY",
      country: String(formData.get("country") || "") || undefined,
      contactFirstName: String(formData.get("contactFirstName")),
      contactSurname: String(formData.get("contactSurname")),
      contactEmail: String(formData.get("contactEmail") || "") || undefined,
      contactPhone: String(formData.get("contactPhone") || "") || undefined,
    });
  }

  const showWarning = effectiveDuplicates.length > 0 && !acknowledged;

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Company name" name="name" required value={name} onChange={handleNameChange} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-ink-muted)]">Type</span>
          <select name="kind" className="rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm">
            <option value="COMPANY">Company</option>
            <option value="PERSON">Person</option>
          </select>
        </label>
      </div>

      <Field label="Country" name="country" />

      <div className="h-px bg-[var(--color-border)]" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Primary contact — first name" name="contactFirstName" required />
        <Field label="Primary contact — surname" name="contactSurname" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" name="contactEmail" type="email" value={email} onChange={handleEmailChange} />
        <Field label="Telephone" name="contactPhone" type="tel" />
      </div>

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
        <Button type="button" variant="ghost" onClick={() => router.push("/customers")}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={showWarning || submitting}>
          {submitting ? "Creating…" : "Create customer"}
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
