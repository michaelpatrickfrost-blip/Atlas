import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";
import { getPayrollSettings } from "@/modules/payroll/services/commands";
import { savePayrollSettings } from "../actions";

export default async function PayrollSettingsPage() {
  const session = await requireSession();
  assertCapability(session, PAYROLL_CAPABILITIES.settingsManage);
  const settings = await getPayrollSettings(session.organisationId);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Payroll settings</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">The PAYE and Accounts Office references, and the default pension contribution percentages, used for every payroll run. Current tax year: {settings.currentTaxYear}.</p>
      </div>
      <ActionForm action={savePayrollSettings} className="grid gap-4">
        <label className="text-sm">PAYE reference<input name="payeReference" defaultValue={settings.payeReference ?? ""} maxLength={20} placeholder="123/AB45678" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
        <label className="text-sm">Accounts Office reference<input name="accountsOfficeReference" defaultValue={settings.accountsOfficeReference ?? ""} maxLength={20} placeholder="123PA00012345" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
        <label className="text-sm">Pension scheme name<input name="pensionSchemeName" defaultValue={settings.pensionSchemeName ?? ""} maxLength={150} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
        <label className="text-sm">Employer pension contribution (%)<input type="number" step="0.1" min="0" max="100" name="employerPensionPercent" defaultValue={settings.employerPensionPercent} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
        <label className="text-sm">Employee pension contribution (%)<input type="number" step="0.1" min="0" max="100" name="employeePensionPercent" defaultValue={settings.employeePensionPercent} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
        <Button type="submit" variant="primary" className="justify-self-start">Save</Button>
      </ActionForm>
    </div>
  );
}
