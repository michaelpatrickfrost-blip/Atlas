import { visibleGuides, type Guide } from './catalogue';
import type { ModuleManifest } from '@/core/modules/types';

export type GuideCategory = 'Setup' | 'Daily work' | 'Troubleshooting';
export type GuideLibraryEntry = { id: string; title: string; summary: string; href: string; category: GuideCategory; searchText?: string; steps?: number };
export type GuideApp = { id: string; name: string; description: string; guides: GuideLibraryEntry[] };
const setup = new Set(['getting-started', 'products', 'customers', 'studio', 'templates']);
export function guideCategory(guide: Guide): GuideCategory { return guide.category ?? (setup.has(guide.id) ? 'Setup' : 'Daily work'); }
export function guideAppId(guide: Guide, modules: readonly ModuleManifest[]) {
  const owner = modules.find(module => module.id === guide.moduleId);
  return owner?.launcherConsolidatedInto && modules.some(module => module.id === owner.launcherConsolidatedInto)
    ? owner.launcherConsolidatedInto : guide.moduleId ?? (guide.id === 'customers' ? 'customers' : 'workspace');
}
/** Only contributions from accessible apps enter the library. Source links retain their own permission checks. */
export function guideApps(capabilities: ReadonlySet<string>, modules: readonly ModuleManifest[]): GuideApp[] {
  const groups = new Map<string, GuideApp>();
  const add = (id: string, entry: GuideLibraryEntry) => {
    const appModule = modules.find(module => module.id === id);
    if (!groups.has(id)) groups.set(id, { id, name: appModule?.name ?? (id === 'customers' ? 'Customers' : 'Your workspace'), description: appModule?.description ?? 'Find your way around and use shared workspace tools.', guides: [] });
    const group = groups.get(id)!;
    if (!group.guides.some(guide => guide.href === entry.href)) group.guides.push(entry);
  };
  for (const guide of visibleGuides(capabilities, new Set(modules.map(module => module.id)))) add(guideAppId(guide, modules), {
    id: guide.id, title: guide.title, summary: guide.summary, category: guideCategory(guide), href: `/guides/${guide.id}`, steps: guide.steps.length,
    searchText: [...guide.before, ...guide.steps.flatMap(step => [step.title, step.detail]), ...guide.troubleshoot.flatMap(issue => [issue.question, issue.answer]), ...(guide.terms ?? []).flatMap(term => [term.word, term.meaning])].join(' '),
  });
  for (const appModule of modules) for (const guide of appModule.guides ?? []) add(appModule.id, guide);
  return [...groups.values()].sort((a, b) => a.id === 'workspace' ? -1 : b.id === 'workspace' ? 1 : a.name.localeCompare(b.name, 'en-GB'));
}
export function searchGuideApps(apps: GuideApp[], query: string): GuideApp[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return apps.map(app => ({ ...app, guides: app.guides.filter(guide => words.every(word => `${app.name} ${guide.title} ${guide.summary} ${guide.searchText ?? ''}`.toLowerCase().includes(word))) })).filter(app => app.guides.length > 0);
}
