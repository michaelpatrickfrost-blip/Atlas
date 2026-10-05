import { requireSession } from '@/core/auth/session';

export default async function CampaignsPage() {
  await requireSession();
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Campaigns</h1><p className="text-gray-600">No campaigns yet</p></div>;
}
