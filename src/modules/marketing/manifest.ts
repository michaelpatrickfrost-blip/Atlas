import { Megaphone } from 'lucide-react';
import type { ModuleManifest } from '@/core/modules/types';
import { MARKETING_CAPABILITIES } from '@/core/permissions/capabilities';
import { marketingAttention, marketingSearch, marketingCustomer, marketingAnalytics } from './services/providers';

const desk: Array<[string, string, string]> = [
  ['Campaigns', '/marketing', 'marketing.campaign.read'],
  ['Calendar', '/marketing/calendar', 'marketing.campaign.read'],
  ['Budgets', '/marketing/budgets', 'marketing.campaign.read'],
  ['Journey', '/marketing/journey', 'marketing.campaign.read'],
  ['Leads', '/marketing/leads', 'marketing.lead.read'],
];

export const marketingManifest: ModuleManifest = {
  id: 'marketing',
  name: 'Marketing',
  description: 'Campaigns, a calendar, budgets Finance can approve, and the customer journey.',
  icon: Megaphone,
  version: '0.1.0',
  minimumCoreVersion: '0.1.0',
  dependencies: [],
  capabilities: Object.values(MARKETING_CAPABILITIES),
  rootPath: '/marketing',
  accessCapability: 'marketing.campaign.read',
  status: 'available',
  attentionProvider: marketingAttention,
  searchProvider: marketingSearch,
  customerOverviewProvider: marketingCustomer,
  analyticsProvider: marketingAnalytics,
  navigation: desk.map(([label, href, capability]) => ({ label, href, capability })),
};
