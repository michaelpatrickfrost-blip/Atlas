'use client';

import { useEffect, useId, useState, useRef, type ReactNode } from 'react';
import { ArrowLeft, ArrowDown, ArrowUp, Check, Copy, Eye, LayoutPanelLeft, Monitor, Plus, Search, Smartphone, Tablet, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { inputClass } from '@/components/ui/service-fields';
import type { PageComponent, PagePayload, PageSection } from '@/core/studio/pages/schema';
import { addPageComponent, addPageSection, applyPagePreset, changePageNode, duplicatePageNode, movePageNode, pageFieldIdentity, removePageNode, selectedPageNode, type PageEditorField, type PageEditorNode, type PageEditorSelection } from './page-editor-model';
import styles from './page-editor.module.css';
import { PageConditionControls } from './page-conditions';
import { addConditionalVariant, moveConditionalVariant, patchVariantNode, presentationVariant, variantDesignPage, hasConditionChoices, type PageEditorConditions } from './page-conditions-model';

type PaletteComponent = { [K in PageComponent['type']]: Omit<Extract<PageComponent, { type: K }>, 'id'> }[PageComponent['type']];
export type PageEditorTableChoices = { columns: readonly { id: string; label: string }[]; maxPageSize: number };
export type PageEditorPaletteItem = { key: string; label: string; description: string; component: PaletteComponent; sourceHref?: string; whereUsedHref?: string;
  /** Presentation-only choices from this exact approved query. Never a grant. */
  table?: PageEditorTableChoices };
export type PageEditorFieldChoice = { key: string; label: string; field: PageEditorField; editable: boolean; required: boolean; sourceHref?: string; whereUsedHref?: string };
export type PageEditorPreset = { key: string; label: string; description: string; sections: readonly PageSection[] };
export type PageEditorCanvasProps = {
  page: PagePayload; formFactor: PagePayload['formFactors'][number]; selection: PageEditorSelection | null;
  onSelect: (selection: PageEditorSelection) => void; mode: 'edit' | 'preview';
  /** Shared renderer must disable all domain commands and data mutations in both modes. */
  interaction: 'design_only';
  /** Explicit alternate-layout sample; never a client-selected live variant. */
  designVariantId?: string;
};
export type PageEditorSaveResult = { status: 'saved' | 'conflict' | 'invalid'; message?: string };
export type PageEditorProps = {
  businessName: string; screenName: string; workspaceHref: string; liveVersionLabel?: string;
  page: PagePayload; savedPage?: PagePayload; onChange: (page: PagePayload) => void; createNodeId: () => string;
  palette: readonly PageEditorPaletteItem[]; fields: readonly PageEditorFieldChoice[]; presets: readonly PageEditorPreset[];
  conditions?: PageEditorConditions;
  newSection: Omit<PageSection, 'id'>;
  renderCanvas: (props: PageEditorCanvasProps) => ReactNode;
  saveDraft: (page: PagePayload) => Promise<PageEditorSaveResult>;
  requestPublishReview?: (page: PagePayload) => Promise<void>;
  /** Current server review, including dependency/required-field and mobile issues. */
  review: { page: PagePayload; status: 'pending' | 'valid' | 'invalid'; messages: readonly { severity: 'error' | 'warning'; message: string }[] };
};
const names: Record<PageComponent['type'], string> = { fields: 'Details', facts: 'At a glance', queryList: 'Related records', metric: 'Key number', instructions: 'Instructions', callout: 'Helpful note', action: 'Button', surface: 'Business panel', analyticsView: 'Saved dashboard' };
const devices = [{ id: 'desktop', label: 'Desktop', icon: Monitor }, { id: 'tablet', label: 'Tablet', icon: Tablet }, { id: 'phone', label: 'Phone', icon: Smartphone }] as const;
const nodeName = (node: PageEditorNode) => node.label || ('type' in node ? names[node.type] : 'Section');
const safeHref = (href?: string) => href?.startsWith('/') && !href.startsWith('//') ? href : undefined;
const sameReference = (left: PagePayload['entity'], right: PagePayload['entity']) => left.id === right.id && left.version === right.version && left.schemaHash === right.schemaHash && left.contractHash === right.contractHash;
function matchesPalette(item: PageEditorPaletteItem, node: PageComponent): boolean {
  const component = item.component;
  if (node.type === 'action' && component.type === 'action') return sameReference(node.command, component.command);
  if (node.type === 'queryList' && component.type === 'queryList') return sameReference(node.query, component.query);
  if (node.type === 'metric' && component.type === 'metric') return sameReference(node.metric, component.metric);
  if (node.type === 'surface' && component.type === 'surface') return sameReference(node.surface, component.surface);
  if (node.type === 'analyticsView' && component.type === 'analyticsView') return node.view.definitionId === component.view.definitionId && node.view.versionId === component.view.versionId && node.view.checksum === component.view.checksum;
  if (node.type === 'fields' && component.type === 'fields') return node.fields.map(pageFieldIdentity).join('|') === component.fields.map(pageFieldIdentity).join('|');
  if (node.type === 'facts' && component.type === 'facts') return node.factIds.join('|') === component.factIds.join('|');
  return false;
}


/** Controlled design workspace. A client adapter supplies callbacks/renderer; a
 * server route cannot serialize render functions directly. All choices are loaded
 * by the owning server adapter; UI state is never publication or data authority.
 */
export function StudioPageEditor(props: PageEditorProps) {
  const { page: basePage, onChange, palette, fields, presets, createNodeId, renderCanvas } = props;
  const [variantId, setVariantId] = useState('');
  const selectedVariant = basePage.variants.find(value => value.id === variantId);
  const page = selectedVariant ? variantDesignPage(basePage, selectedVariant.id) : basePage;
  const variantReadOnly = !!selectedVariant && (!props.conditions?.variantsAllowed || !presentationVariant(selectedVariant));
  const [selection, setSelection] = useState<PageEditorSelection | null>(() => page.sections[0] ? { kind: 'section', id: page.sections[0].id } : null);
  const [device, setDevice] = useState<PagePayload['formFactors'][number]>(page.formFactors[0]);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit'), [tab, setTab] = useState<'library' | 'outline'>('library');
  const [search, setSearch] = useState(''), [saved, setSaved] = useState(() => JSON.stringify(page));
  const [saving, setSaving] = useState(false), [reviewing, setReviewing] = useState(false), [feedback, setFeedback] = useState('');
  const [confirmation, setConfirmation] = useState<{ title: string; detail: string; apply: () => void } | null>(null);
  const confirmationId = useId();
  const dirty = JSON.stringify(basePage) !== (props.savedPage ? JSON.stringify(props.savedPage) : saved), node = selectedPageNode(page, selection);
  const selectedSection = page.sections.find(section => selection?.kind === 'section' ? section.id === selection.id : section.components.some(component => component.id === selection?.id)) ?? page.sections[0];
  const validated = JSON.stringify(props.review.page) === JSON.stringify(basePage) && props.review.status === 'valid' && !props.review.messages.some(message => message.severity === 'error');
  const displayedDevice = page.formFactors.includes(device) ? device : page.formFactors[0];
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const edit = (work: () => PagePayload) => { try { onChange(work()); setFeedback(''); } catch (error) { setFeedback(error instanceof Error ? error.message : 'This change could not be made. Your design is kept.'); } };
  const patch = (change: (current: PageEditorNode) => PageEditorNode) => { if (selection && !variantReadOnly) edit(() => selectedVariant ? patchVariantNode(basePage, selectedVariant.id, selection, change) : changePageNode(basePage, selection, change)); };
  const updateVariant = (change: (variant: NonNullable<typeof selectedVariant>) => NonNullable<typeof selectedVariant>) => { if (selectedVariant && !variantReadOnly && props.conditions?.variantsAllowed) edit(() => ({ ...basePage, variants: basePage.variants.map(value => value.id === selectedVariant.id ? change(value) : value) })); };
  const addVariant = () => { if (props.conditions) edit(() => { const id = createNodeId(); const next = addConditionalVariant(basePage, props.conditions!, id); setVariantId(id); return next; }); };
  const removeVariant = () => { if (!selectedVariant) return; const captured = selectedVariant.id; setConfirmation({ title: `Remove ${selectedVariant.label}?`, detail: 'This removes the alternate layout from the draft. The default layout and stored business records are kept.', apply: () => { onChange({ ...basePage, variants: basePage.variants.filter(value => value.id !== captured) }); setVariantId(''); } }); };
  const save = async () => {
    const submitted = structuredClone(basePage), snapshot = JSON.stringify(submitted);
    setSaving(true); setFeedback('');
    try { const result = await props.saveDraft(submitted); if (result.status === 'saved') { setSaved(snapshot); setFeedback(result.message || 'Draft saved. Your business screen has not changed.'); }
      else setFeedback(result.message || (result.status === 'conflict' ? 'Someone else saved this screen. Your changes are kept; compare with the saved draft before trying again.' : 'Your design is kept. Review the items below before saving again.')); }
    catch { setFeedback('The draft could not be saved. Your changes are kept; try again.'); }
    finally { setSaving(false); }
  };
  const publishReview = async () => {
    if (!props.requestPublishReview || dirty || !validated) return;
    setReviewing(true); try { await props.requestPublishReview(structuredClone(basePage)); }
    catch { setFeedback('The publication review could not be opened. Your saved draft is kept.'); }
    finally { setReviewing(false); }
  };
  const addSection = () => edit(() => {
    const section = { ...structuredClone(props.newSection), id: createNodeId(), components: props.newSection.components.map(component => ({ ...structuredClone(component), id: createNodeId() })) };
    const next = addPageSection(page, section); setSelection({ kind: 'section', id: section.id }); return next;
  });
  const addComponent = (item: PageEditorPaletteItem) => edit(() => {
    const component = { ...structuredClone(item.component), id: createNodeId() } as PageComponent;
    const next = addPageComponent(page, selectedSection.id, component); setSelection({ kind: 'component', id: component.id }); setTab('outline'); return next;
  });
  const duplicate = () => { if (selection) edit(() => { const copy = duplicatePageNode(page, selection, createNodeId); setSelection(copy.selection); return copy.page; }); };
  const remove = () => {
    if (!selection || !node) return;
    const captured = selection;
    const count = 'components' in node ? node.components.length : null;
    setConfirmation({ title: `Remove ${nodeName(node)}?`, detail: count === null ? 'This item will leave the draft layout. Stored business information is kept.' : `This removes the section and its ${count} ${count === 1 ? 'item' : 'items'} from the draft layout. Stored business information is kept.`, apply: () => edit(() => { const next = removePageNode(page, captured); setSelection({ kind: 'section', id: next.sections[0].id }); return next; }) });
  };
  const preset = (item: PageEditorPreset) => setConfirmation({ title: `Use ${item.label}?`, detail: `This replaces ${page.sections.length} existing ${page.sections.length === 1 ? 'section' : 'sections'} in this draft. Your live business screen is unchanged.`, apply: () => edit(() => { const next = applyPagePreset(page, item.sections, createNodeId); setSelection({ kind: 'section', id: next.sections[0].id }); return next; }) });
  const ordered = selection?.kind === 'section' ? page.sections : selectedSection?.components ?? [];
  const selectedIndex = ordered.findIndex(item => item.id === selection?.id);
  const available = palette.filter(item => `${item.label} ${item.description}`.toLowerCase().includes(search.toLowerCase()));
  return <main className={styles.workspace} aria-label={`${props.screenName} design studio`}>
    <header className={styles.header}>
      <div className={styles.identity}><a href={safeHref(props.workspaceHref) || '/home'} aria-label="Back to business workspace" className={styles.back}><ArrowLeft size={18}/></a><div><p className={styles.eyebrow}>Atlas Studio <span> / {props.businessName}</span></p><h1>{props.screenName}</h1></div></div>
      <div className={styles.headerActions}><span className={styles.draftStatus}><span aria-hidden="true">{dirty ? '●' : '✓'}</span> {dirty ? 'Unsaved changes' : 'Draft saved'}</span><Button type="button" disabled={saving || reviewing || !dirty} onClick={save}>{saving ? 'Saving…' : 'Save draft'}</Button><Button type="button" variant="primary" disabled={!props.requestPublishReview || dirty || !validated || saving || reviewing} onClick={publishReview}>{reviewing ? 'Opening review…' : 'Review & publish'}</Button></div>
    </header>
    <div className={styles.versionBar}><span><strong>Editing draft</strong> · Changes stay here until published</span><span>{props.liveVersionLabel || 'No published design yet'}</span></div>
    {feedback && <p role="status" className={styles.feedback}>{feedback}</p>}
    {(props.conditions || basePage.variants.length > 0) && <div className="flex flex-wrap items-center gap-3 border-b bg-white px-5 py-3 text-xs">
      <label className="flex items-center gap-2"><span>Screen layout</span><select aria-label="Screen layout" className={inputClass} value={selectedVariant?.id ?? ''} onChange={event => setVariantId(event.target.value)}><option value="">Default layout</option>{[...basePage.variants].sort((a, b) => b.priority - a.priority).map(value => <option key={value.id} value={value.id}>{value.label}</option>)}</select></label>
      <Button type="button" disabled={!props.conditions?.variantsAllowed || !hasConditionChoices(props.conditions) || basePage.variants.length >= 20} onClick={addVariant}>Add conditional layout</Button>
      {selectedVariant && <><span>Alternate layout · labelled sample · business rules choose the live layout</span><Button type="button" variant="ghost" disabled={!props.conditions?.variantsAllowed} onClick={removeVariant}>Remove this layout</Button></>}
    </div>}
    {selectedVariant && props.conditions && <details className="border-b bg-white px-5 py-3"><summary className="cursor-pointer text-sm font-semibold">When to use {selectedVariant.label}</summary><div className="mt-3 grid max-w-3xl gap-4 sm:grid-cols-2"><div className="space-y-3"><Property label="Layout name"><input className={inputClass} value={selectedVariant.label} maxLength={100} disabled={variantReadOnly} onChange={event => updateVariant(value => ({ ...value, label: event.target.value }))}/></Property><div className="flex gap-2"><Button type="button" disabled={variantReadOnly || [...basePage.variants].sort((a, b) => b.priority - a.priority)[0]?.id === selectedVariant.id} onClick={() => edit(() => moveConditionalVariant(basePage, selectedVariant.id, -1))}>Use before other layouts</Button><Button type="button" disabled={variantReadOnly || [...basePage.variants].sort((a, b) => b.priority - a.priority).at(-1)?.id === selectedVariant.id} onClick={() => edit(() => moveConditionalVariant(basePage, selectedVariant.id, 1))}>Use after other layouts</Button></div><p className="text-xs leading-5 text-[var(--color-ink-muted)]">Atlas uses the first matching layout. If none match, it uses the default. Change titles, descriptions, columns and visibility here; edit business components in the default layout.</p></div><fieldset disabled={variantReadOnly} className="min-w-0"><PageConditionControls value={selectedVariant.when} catalog={props.conditions} required change={value => { if (value) updateVariant(variant => ({ ...variant, when: value })); }}/></fieldset></div></details>}

    <div className={styles.body}>
      <aside className={styles.library} aria-label="Screen building tools">
        <div className={styles.tabs}>{(['library', 'outline'] as const).map(item => <button type="button" key={item} aria-pressed={tab === item} onClick={() => setTab(item)}>{item === 'library' ? 'Add to screen' : 'Screen outline'}</button>)}</div>
        {tab === 'library' ? <div className={styles.panelContent}>
          <label className={styles.search}><Search size={16} aria-hidden="true"/><input aria-label="Find a component" placeholder="Find a component…" value={search} onChange={event => setSearch(event.target.value)}/></label>
          <p className={styles.panelHint}>Add to <strong>{selectedSection?.label || 'your selected section'}</strong></p>
          <div className={styles.libraryItems}>{available.map(item => <button type="button" key={item.key} aria-label={`Add ${item.label}`} disabled={!!selectedVariant} onClick={() => addComponent(item)} className={styles.libraryItem}><span className={styles.libraryIcon}><LayoutPanelLeft size={18}/></span><span><strong>{item.label}</strong><small>{item.description}</small></span><Plus size={14} aria-hidden="true"/></button>)}</div>
          {!available.length && <p className={styles.panelHint}>No matching components. Try another name.</p>}
          <Button type="button" className="w-full" disabled={!!selectedVariant} onClick={addSection}><Plus size={16}/> Add section</Button>
          {presets.length > 0 && <div className={styles.presets}><h2>Start with a layout</h2><p>Useful starting points for this screen.</p>{presets.map(item => <button type="button" key={item.key} aria-label={`Use ${item.label}`} disabled={!!selectedVariant} onClick={() => preset(item)}><span className={styles.presetSketch} aria-hidden="true"><i/><i/><i/></span><strong>{item.label}</strong><small>{item.description}</small></button>)}</div>}
        </div> : <div className={styles.panelContent}><p className={styles.panelHint}>Select a section or an item to customise it.</p>{page.sections.map((section, index) => <div className={styles.outlineGroup} key={section.id}><button type="button" aria-pressed={selection?.kind === 'section' && selection.id === section.id} onClick={() => setSelection({ kind: 'section', id: section.id })}><span>{index + 1}</span><strong>{section.label}</strong></button>{section.components.map(component => <button type="button" key={component.id} aria-pressed={selection?.kind === 'component' && selection.id === component.id} onClick={() => setSelection({ kind: 'component', id: component.id })} className={styles.outlineChild}>{nodeName(component)}</button>)}</div>)}<Button type="button" className="w-full" disabled={!!selectedVariant} onClick={addSection}><Plus size={16}/> Add section</Button></div>}
      </aside>
      <section className={styles.canvasArea} aria-label="Design canvas">
        <div className={styles.canvasToolbar}><div><h2>{mode === 'preview' ? 'Preview your screen' : 'Your business screen'}</h2><p>{mode === 'preview' ? 'Preview only · buttons do not run business operations' : 'Select an item to make it your own'}</p></div><div className={styles.viewControls}><div className={styles.deviceControls}>{devices.filter(item => page.formFactors.includes(item.id)).map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-label={`${label} preview`} aria-pressed={displayedDevice === id} onClick={() => setDevice(id)}><Icon size={17}/></button>)}</div><button type="button" className={styles.previewToggle} aria-pressed={mode === 'preview'} onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}><Eye size={16}/>{mode === 'preview' ? 'Back to design' : 'Preview'}</button></div></div>
        <div className={styles.canvasScroll}><div className={`${styles.frame} ${styles[displayedDevice]}`} data-form-factor={displayedDevice}>{renderCanvas({ page, formFactor: displayedDevice, selection: mode === 'preview' ? null : selection, onSelect: mode === 'preview' ? () => {} : setSelection, mode, interaction: 'design_only', ...(selectedVariant ? { designVariantId: selectedVariant.id } : {}) })}</div></div>
        <footer className={styles.canvasFooter}><span>{props.businessName} · {props.screenName}</span><span>Design only · Business records are unchanged</span></footer>
      </section>
      <aside className={styles.properties} aria-label="Selected item properties">
        <div className={styles.propertiesHeading}><p>Properties</p><h2>{node ? nodeName(node) : 'Choose an item'}</h2></div>
        <div className={styles.panelContent}>{variantReadOnly && <p className={styles.panelHint}>This saved layout has advanced changes and is read-only here. Choose the default layout to edit its components.</p>}<fieldset disabled={variantReadOnly} className="m-0 min-w-0 border-0 p-0">{node && selection ? <>
          <div className={styles.nodeActions}><button type="button" aria-label="Move selected item up" disabled={!!selectedVariant || selectedIndex <= 0} onClick={() => edit(() => movePageNode(page, selection, -1))}><ArrowUp size={16}/></button><button type="button" aria-label="Move selected item down" disabled={!!selectedVariant || selectedIndex < 0 || selectedIndex === ordered.length - 1} onClick={() => edit(() => movePageNode(page, selection, 1))}><ArrowDown size={16}/></button><button type="button" aria-label="Duplicate selected item" disabled={!!selectedVariant} onClick={duplicate}><Copy size={16}/></button><button type="button" aria-label="Remove selected item" disabled={!!selectedVariant} onClick={remove}><Trash2 size={16}/></button></div>
          <Property label="Display name"><input className={inputClass} maxLength={100} value={node.label || ''} onChange={event => patch(current => { const next = { ...current, label: event.target.value }; if (!event.target.value && !('components' in current)) delete (next as PageComponent).label; return next; })}/></Property>
          <Property label="Helpful description"><textarea className={inputClass} rows={3} maxLength={500} value={node.help || ''} onChange={event => patch(current => ({ ...current, help: event.target.value }))}/></Property>
          {'type' in node && <fieldset className="space-y-2 rounded-xl border p-3"><legend className="px-1 text-xs font-semibold">Show on these screens</legend>
            {devices.filter(device => page.sections.some(section => section.components.some(component => component.id === node.id) && section.formFactors.includes(device.id))).map(({ id, label }) => {
              const approved = palette.find(item => matchesPalette(item, node));
              const ownerBound = node.type === 'surface' || node.type === 'action' || node.type === 'metric';
              const available = !ownerBound || !!approved?.component.formFactors.includes(id);
              return <label key={id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={node.formFactors.includes(id)}
                disabled={!available || (node.formFactors.length === 1 && node.formFactors.includes(id))}
                onChange={event => patch(current => ({ ...current, formFactors: event.target.checked
                  ? devices.map(device => device.id).filter(form => form === id || current.formFactors.includes(form))
                  : current.formFactors.filter(form => form !== id) }))}/>{label}</label>;
            })}<p className={styles.panelHint}>Keep at least one screen selected. Atlas checks that each complete layout remains usable before publication.</p>
          </fieldset>}
          {'components' in node && <><h3 className={styles.propertySubheading}>Section layout</h3>{(['desktop', 'tablet'] as const).map(form => <Property key={form} label={`${form === 'desktop' ? 'Desktop' : 'Tablet'} columns`}><select className={inputClass} value={node.columns[form]} onChange={event => patch(current => 'components' in current ? { ...current, columns: { ...current.columns, [form]: Number(event.target.value) } } : current)}>{Array.from({ length: form === 'desktop' ? 3 : 2 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'column' : 'columns'}</option>)}</select></Property>)}<p className={styles.panelHint}>Phone screens use one column so every detail is easy to read.</p></>}
          {!selectedVariant && 'type' in node && (node.type === 'instructions' || node.type === 'callout') && <Property label={node.type === 'instructions' ? 'Instructions' : 'Message'}><textarea className={inputClass} rows={6} maxLength={node.type === 'instructions' ? 2000 : 1000} value={node.text} onChange={event => patch(current => 'type' in current && (current.type === 'instructions' || current.type === 'callout') ? { ...current, text: event.target.value } : current)}/></Property>}
          {!selectedVariant && 'type' in node && node.type === 'callout' && <Property label="Message style"><select className={inputClass} value={node.tone} onChange={event => patch(current => 'type' in current && current.type === 'callout' ? { ...current, tone: event.target.value as 'info' | 'success' | 'warning' } : current)}><option value="info">Information</option><option value="success">Good news</option><option value="warning">Needs attention</option></select></Property>}
          {!selectedVariant && 'type' in node && node.type === 'fields' && <FieldProperties component={node} choices={fields} change={change => patch(current => 'type' in current && current.type === 'fields' ? change(current) : current)}/>}
          {!selectedVariant && 'type' in node && node.type === 'facts' && <FactProperties component={node} palette={palette} change={change => patch(current => 'type' in current && current.type === 'facts' ? change(current) : current)}/>}
          {!selectedVariant && 'type' in node && node.type === 'queryList' && <TableProperties component={node} choices={palette.find(item => matchesPalette(item, node))?.table} change={change => patch(current => 'type' in current && current.type === 'queryList' ? change(current) : current)}/>}
          {!selectedVariant && 'type' in node && node.type === 'action' && <><Property label="Button does"><select className={inputClass} value={palette.find(item => matchesPalette(item, node))?.key || ''} onChange={event => { const item = palette.find(item => item.key === event.target.value); if (item?.component.type === 'action') patch(current => ({ ...structuredClone(item.component), id: current.id, label: current.label, help: current.help }) as PageComponent); }}><option value="" disabled>Existing approved operation</option>{palette.filter(item => item.component.type === 'action').map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></Property><Property label="Button icon"><select className={inputClass} value={node.icon || 'arrow'} onChange={event => patch(current => 'type' in current && current.type === 'action' ? { ...current, icon: event.target.value as Extract<PageComponent, { type: 'action' }>['icon'] } : current)}>{([['arrow', 'Arrow'], ['check', 'Check mark'], ['plus', 'Plus'], ['document', 'Document'], ['send', 'Send'], ['settings', 'Settings']] as const).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Property><p className={styles.panelHint}>Atlas checks permissions and business rules each time this button is used. Preview never runs it.</p></>}
          {!selectedVariant && 'type' in node && node.type === 'analyticsView' && <><Property label="Saved dashboard"><select className={inputClass} value={palette.find(item => matchesPalette(item, node))?.key || ''} onChange={event => { const item = palette.find(item => item.key === event.target.value); if (item?.component.type === 'analyticsView') patch(current => ({ ...structuredClone(item.component), id: current.id, label: current.label, help: current.help, formFactors: current.formFactors, ...(current.visibleWhen ? { visibleWhen: current.visibleWhen } : {}) }) as PageComponent); }}><option value="" disabled>Previously selected saved version</option>{palette.filter(item => item.component.type === 'analyticsView').map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></Property><p className={styles.panelHint}>This screen keeps the selected saved dashboard version. Publishing a newer dashboard does not silently change this screen. Every viewer still needs access to its measures.</p></>}
          {props.conditions && <><h3 className={styles.propertySubheading}>Visibility</h3><PageConditionControls value={node.visibleWhen} catalog={props.conditions} change={value => patch(current => { const next = { ...current, visibleWhen: value }; if (!value) delete next.visibleWhen; return next; })}/></>}{!props.conditions && node.visibleWhen && <p className={styles.panelHint}>Shown when the configured business rules apply.</p>}
          {'type' in node && palette.filter(item => matchesPalette(item, node)).slice(0, 1).map(item => <div className={styles.sourceLinks} key={item.key}>{safeHref(item.sourceHref) && <a href={safeHref(item.sourceHref)}>Go to source</a>}{safeHref(item.whereUsedHref) && <a href={safeHref(item.whereUsedHref)}>Where used</a>}</div>)}
        </> : <p className={styles.panelHint}>Select something on the canvas or in the screen outline.</p>}</fieldset>
          <div className={styles.readiness}><h3>{validated ? <><Check size={16}/> Ready for review</> : props.review.status === 'pending' ? 'Checking your design' : 'Review your design'}</h3>{props.review.messages.length ? <ul>{props.review.messages.map((message, i) => <li key={i}><strong>{message.severity === 'error' ? 'Needs attention' : 'Note'}:</strong> {message.message}</li>)}</ul> : <p>{validated ? 'Save the draft, then review the changes before publishing.' : 'The business checks will appear here.'}</p>}</div>
        </div>
      </aside>
    </div>
    {confirmation && <ConfirmationDialog id={confirmationId} title={confirmation.title} detail={confirmation.detail} cancel={() => setConfirmation(null)} confirm={() => { confirmation.apply(); setConfirmation(null); }}/>}
  </main>;
}
function Property({ label, children }: { label: string; children: ReactNode }) { return <label className={styles.property}><span>{label}</span>{children}</label>; }
function FieldProperties({ component, choices, change }: { component: Extract<PageComponent, { type: 'fields' }>; choices: readonly PageEditorFieldChoice[]; change: (change: (component: Extract<PageComponent, { type: 'fields' }>) => Extract<PageComponent, { type: 'fields' }>) => void }) {
  const update = (index: number, field: PageEditorField) => change(current => ({ ...current, fields: current.fields.map((item, i) => i === index ? field : item) }));
  const move = (index: number, direction: -1 | 1) => change(current => { const fields = [...current.fields]; [fields[index], fields[index + direction]] = [fields[index + direction], fields[index]]; return { ...current, fields }; });
  return <div><h3 className={styles.propertySubheading}>Details in this group</h3>{component.fields.map((field, index) => {
    const choice = choices.find(item => pageFieldIdentity(item.field) === pageFieldIdentity(field));
    const label = field.label || choice?.label || 'Business detail';
    return <div className={styles.fieldProperty} key={pageFieldIdentity(field)}><div className={styles.fieldHeading}><strong>{label}</strong><div><button type="button" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={14}/></button><button type="button" aria-label={`Move ${label} down`} disabled={index === component.fields.length - 1} onClick={() => move(index, 1)}><ArrowDown size={14}/></button><button type="button" aria-label={`Remove ${label} from group`} disabled={component.fields.length === 1 || choice?.required} onClick={() => change(current => ({ ...current, fields: current.fields.filter((_, i) => i !== index) }))}><Trash2 size={14}/></button></div></div><Property label={`${choice?.label || 'Detail'} label`}><input className={inputClass} maxLength={100} value={field.label || ''} placeholder={choice?.label} onChange={event => { const next: PageEditorField = { ...field, label: event.target.value }; if (!event.target.value) delete next.label; update(index, next); }}/></Property><Property label={`${choice?.label || 'Detail'} help`}><textarea className={inputClass} rows={2} maxLength={500} value={field.help || ''} onChange={event => update(index, { ...field, help: event.target.value })}/></Property>{choice?.editable ? <label className={styles.editableToggle}><input type="checkbox" checked={field.mode === 'edit'} onChange={event => update(index, { ...field, mode: event.target.checked ? 'edit' : 'read' })}/>Allow editing</label> : <p className={styles.panelHint}>Read-only business detail</p>}{choice?.required && <p className={styles.panelHint}>Required detail · business validation stays in place</p>}{choice && <div className={styles.sourceLinks}>{safeHref(choice.sourceHref) && <a href={safeHref(choice.sourceHref)}>Go to source</a>}{safeHref(choice.whereUsedHref) && <a href={safeHref(choice.whereUsedHref)}>Where used</a>}</div>}</div>;
  })}<Property label="Add a detail"><select className={inputClass} value="" disabled={component.fields.length >= 30} onChange={event => { const choice = choices.find(item => item.key === event.target.value); if (choice) change(current => ({ ...current, fields: [...current.fields, structuredClone(choice.field)] })); }}><option value="">Choose a business detail</option>{choices.filter(choice => !component.fields.some(field => pageFieldIdentity(field) === pageFieldIdentity(choice.field))).map(choice => <option key={choice.key} value={choice.key}>{choice.label}</option>)}</select></Property></div>;
}

function FactProperties({ component, palette, change }: { component: Extract<PageComponent, { type: 'facts' }>; palette: readonly PageEditorPaletteItem[];
  change: (change: (component: Extract<PageComponent, { type: 'facts' }>) => Extract<PageComponent, { type: 'facts' }>) => void }) {
  const choices = palette.flatMap(item => item.component.type === 'facts' && item.component.factIds.length === 1 ? [{ id: item.component.factIds[0], label: item.component.label ?? item.label }] : []);
  if (component.factIds.some(id => !choices.some(choice => choice.id === id))) return <p className={styles.panelHint}>This panel includes a detail that is currently unavailable. Its saved choices are kept; restore access before changing them.</p>;
  const move = (index: number, direction: -1 | 1) => change(current => { const factIds = [...current.factIds]; [factIds[index], factIds[index + direction]] = [factIds[index + direction], factIds[index]]; return { ...current, factIds }; });
  return <div><h3 className={styles.propertySubheading}>At a glance details</h3>{component.factIds.map((id, index) => {
    const label = choices.find(choice => choice.id === id)!.label;
    return <div className={styles.fieldProperty} key={id}><div className={styles.fieldHeading}><strong>{label}</strong><div>
      <button type="button" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={14}/></button>
      <button type="button" aria-label={`Move ${label} down`} disabled={index === component.factIds.length - 1} onClick={() => move(index, 1)}><ArrowDown size={14}/></button>
      <button type="button" aria-label={`Remove ${label} from panel`} disabled={component.factIds.length === 1} onClick={() => change(current => ({ ...current, factIds: current.factIds.filter(value => value !== id) }))}><Trash2 size={14}/></button>
    </div></div></div>;
  })}<Property label="Add a summary detail"><select className={inputClass} value="" disabled={component.factIds.length >= 20} onChange={event => {
    const choice = choices.find(value => value.id === event.target.value); if (choice && !component.factIds.includes(choice.id)) change(current => ({ ...current, factIds: [...current.factIds, choice.id] }));
  }}><option value="">Choose a business detail</option>{choices.filter(choice => !component.factIds.includes(choice.id)).map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select></Property></div>;
}
function TableProperties({ component, choices, change }: { component: Extract<PageComponent, { type: 'queryList' }>; choices?: PageEditorTableChoices;
  change: (change: (component: Extract<PageComponent, { type: 'queryList' }>) => Extract<PageComponent, { type: 'queryList' }>) => void }) {
  if (!choices || !Number.isSafeInteger(choices.maxPageSize) || choices.maxPageSize < 1 || choices.maxPageSize > 50
    || component.columns.some(id => !choices.columns.some(column => column.id === id)) || component.pageSize > choices.maxPageSize)
    return <p className={styles.panelHint}>This table&apos;s saved choices are currently unavailable. They are kept; restore the app&apos;s access before changing its columns or rows.</p>;
  const move = (index: number, direction: -1 | 1) => change(current => { const columns = [...current.columns]; [columns[index], columns[index + direction]] = [columns[index + direction], columns[index]]; return { ...current, columns }; });
  return <div><h3 className={styles.propertySubheading}>Table details</h3><Property label="Rows per page"><select className={inputClass} value={component.pageSize} onChange={event => {
    const pageSize = Number(event.target.value); if (Number.isInteger(pageSize) && pageSize >= 1 && pageSize <= choices.maxPageSize) change(current => ({ ...current, pageSize }));
  }}>{Array.from({ length: choices.maxPageSize }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? 'row' : 'rows'}</option>)}</select></Property>
    <p className={styles.panelHint}>Columns show the app&apos;s approved details. Changing this table does not change the records.</p>
    {component.columns.map((id, index) => { const label = choices.columns.find(column => column.id === id)!.label;
      return <div className={styles.fieldProperty} key={id}><div className={styles.fieldHeading}><strong>{label}</strong><div>
        <button type="button" aria-label={`Move ${label} column up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={14}/></button>
        <button type="button" aria-label={`Move ${label} column down`} disabled={index === component.columns.length - 1} onClick={() => move(index, 1)}><ArrowDown size={14}/></button>
        <button type="button" aria-label={`Remove ${label} column`} disabled={component.columns.length === 1} onClick={() => change(current => ({ ...current, columns: current.columns.filter(value => value !== id) }))}><Trash2 size={14}/></button>
      </div></div></div>;
    })}<Property label="Add a column"><select className={inputClass} value="" disabled={component.columns.length >= 12} onChange={event => {
      const column = choices.columns.find(value => value.id === event.target.value); if (column && !component.columns.includes(column.id)) change(current => ({ ...current, columns: [...current.columns, column.id] }));
    }}><option value="">Choose a table detail</option>{choices.columns.filter(column => !component.columns.includes(column.id)).map(column => <option key={column.id} value={column.id}>{column.label}</option>)}</select></Property>
  </div>;
}

function ConfirmationDialog({ id, title, detail, cancel, confirm }: { id: string; title: string; detail: string; cancel: () => void; confirm: () => void }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    root.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previous?.focus();
  }, []);
  return <div className={styles.modalBackdrop}><section ref={root} role="dialog" aria-modal="true" aria-labelledby={id} className={styles.modal} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); cancel(); }
    if (event.key === 'Tab') { const buttons = root.current?.querySelectorAll<HTMLButtonElement>('button'); if (!buttons?.length) return;
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) { event.preventDefault(); buttons[0].focus(); }
    }
  }}><h2 id={id}>{title}</h2><p>{detail}</p><div><Button type="button" onClick={cancel}>Keep my design</Button><Button type="button" variant="primary" onClick={confirm}>Confirm change</Button></div></section></div>;
}
