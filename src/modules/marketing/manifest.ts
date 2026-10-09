import { Megaphone } from 'lucide-react';
import type { ModuleManifest } from '@/core/modules/types';
import { MARKETING_CAPABILITIES } from '@/core/permissions/capabilities';
import { marketingAttention, marketingSearch, marketingCustomer, marketingAnalytics } from './services/providers';

const desk: Array<[string, string, string]> = [
  ['Campaigns', '/marketing', 'marketing.campaign.read'],
  ['Calendar', '/marketing/calendar', 'marketing.campaign.read'],
  ['Social', '/marketing/social', 'marketing.campaign.read'],
  ['Budgets', '/marketing/budgets', 'marketing.campaign.read'],
  ['Journey mapper', '/marketing/journey', 'marketing.campaign.read'],
  ['Journey automation', '/marketing/journeys', 'marketing.journey.read'],
  ['Audiences', '/marketing/audiences', 'marketing.audience.read'],
  ['Content', '/marketing/content', 'marketing.content.read'],
  ['Messages', '/marketing/email', 'marketing.email.read'],
  ['Profiles', '/marketing/profiles', 'marketing.profile.read'],
  ['Consent', '/marketing/consent', 'marketing.consent.view'],
  ['Analytics', '/marketing/analytics', 'marketing.report.read'],
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
  navigation: desk.map(([label, href, capability]) => ({ label, href, capability, group: ['/marketing/audiences','/marketing/profiles','/marketing/consent'].includes(href) ? 'People & permissions' : ['/marketing/journey','/marketing/journeys'].includes(href) ? 'Customer journeys' : ['/marketing/content','/marketing/email','/marketing/social'].includes(href) ? 'Content & channels' : 'Campaign workspace' })),
};
