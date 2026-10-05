import { requireSession } from '@/core/auth/session';

export default async function PayrollPage() {
  await requireSession();
  return <div><h1 className="text-3xl font-bold">Payroll</h1></div>;
}
