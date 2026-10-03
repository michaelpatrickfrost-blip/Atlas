"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { revealBankAccount } from "@/core/customers/commands";

/** Full bank details are fetched on demand, never included in the page's
 *  initial payload (§23). Each reveal is itself audited server-side. */
export function RevealBankAccount({ bankAccountId, partyId, canReveal }: { bankAccountId: string; partyId: string; canReveal: boolean }) {
  const [revealed, setRevealed] = useState<{ sortCode: string | null; accountNumber: string | null; iban: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!canReveal) return null;

  if (revealed) {
    return (
      <span className="font-mono text-sm text-[var(--color-ink)]">
        {revealed.sortCode && <>{revealed.sortCode} · </>}
        {revealed.accountNumber ?? revealed.iban}
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const account = await revealBankAccount(bankAccountId, partyId);
        setRevealed({ sortCode: account.sortCode, accountNumber: account.accountNumber, iban: account.iban });
        setLoading(false);
      }}
    >
      {loading ? "Revealing…" : "Reveal"}
    </Button>
  );
}
