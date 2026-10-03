/** Masks sensitive bank fields for any response path that isn't an explicit,
 *  capability-gated reveal (§23). Never send full values in a page payload
 *  that doesn't need them. */
export function maskSortCode(sortCode: string | null): string | null {
  if (!sortCode) return sortCode;
  return "••-••-" + sortCode.replace(/\D/g, "").slice(-2);
}

export function maskAccountNumber(accountNumber: string | null): string | null {
  if (!accountNumber) return accountNumber;
  const digits = accountNumber.replace(/\D/g, "");
  return "••••" + digits.slice(-4);
}

export function maskIban(iban: string | null): string | null {
  if (!iban) return iban;
  return iban.slice(0, 4) + " •••• " + iban.slice(-4);
}

export type MaskedBankAccount<T extends { sortCode: string | null; accountNumber: string | null; iban: string | null }> =
  Omit<T, "sortCode" | "accountNumber" | "iban"> & {
    sortCode: string | null;
    accountNumber: string | null;
    iban: string | null;
  };

export function maskBankAccount<T extends { sortCode: string | null; accountNumber: string | null; iban: string | null }>(
  account: T,
): MaskedBankAccount<T> {
  return {
    ...account,
    sortCode: maskSortCode(account.sortCode),
    accountNumber: maskAccountNumber(account.accountNumber),
    iban: maskIban(account.iban),
  };
}
