import { requireSession } from '@/core/auth/session';

export default async function PayrollRunPage({ params }: { params: { runId: string } }) {
  await requireSession();
  return <div><h1 className="text-3xl font-bold">Payroll Run</h1></div>;
}
