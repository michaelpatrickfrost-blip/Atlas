import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

export default async function MarketingPage() {
  const session = await requireSession();
  await assertCapability(session, 'marketing.campaign.read');

  const thisMonth = {
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  };

  // Get current month data
  const campaigns = await db.marketingCampaign.findMany({
    where: {
      organisationId: session.organisationId,
      status: 'LIVE',
    },
    include: {
      spends: {
        where: {
          createdAt: { gte: thisMonth.start, lte: thisMonth.end },
        },
      },
    },
  });

  const leads = await db.crmLead.findMany({
    where: {
      organisationId: session.organisationId,
      createdAt: { gte: thisMonth.start, lte: thisMonth.end },
    },
  });

  const totalSpend = campaigns.reduce(
    (sum, c) => sum + c.spends.reduce((s, sp) => s + Number(sp.plannedMinor || 0), 0),
    0
  );

  const totalLeads = leads.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing</h1>
        <p className="text-gray-600">Campaign management, audience, content & revenue attribution</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month Spend</p>
              <p className="text-2xl font-bold">£{(totalSpend / 100).toFixed(0)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Leads</p>
              <p className="text-2xl font-bold">{totalLeads}</p>
            </div>
            <Users className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Live Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.length}</p>
            </div>
            <Target className="w-8 h-8 text-purple-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">MQLs</p>
              <p className="text-2xl font-bold">{Math.round(totalLeads * 0.25)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/marketing/campaigns">
          <Card className="p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="font-medium text-lg mb-2">Campaigns</h3>
            <p className="text-sm text-gray-600">Manage marketing campaigns & budgets</p>
          </Card>
        </Link>

        <Link href="/marketing/audience">
          <Card className="p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="font-medium text-lg mb-2">Audience</h3>
            <p className="text-sm text-gray-600">Build segments & target accounts</p>
          </Card>
        </Link>

        <Link href="/marketing/content">
          <Card className="p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="font-medium text-lg mb-2">Content</h3>
            <p className="text-sm text-gray-600">Manage assets & product launches</p>
          </Card>
        </Link>

        <Link href="/marketing/growth">
          <Card className="p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="font-medium text-lg mb-2">Growth</h3>
            <p className="text-sm text-gray-600">Forms, pages, social & experiments</p>
          </Card>
        </Link>

        <Link href="/marketing/insights">
          <Card className="p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="font-medium text-lg mb-2">Insights</h3>
            <p className="text-sm text-gray-600">Revenue attribution & analytics</p>
          </Card>
        </Link>

        <Link href="/marketing/calendar">
          <Card className="p-6 hover:shadow-lg transition cursor-pointer">
            <h3 className="font-medium text-lg mb-2">Calendar</h3>
            <p className="text-sm text-gray-600">Campaign timeline & events</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
