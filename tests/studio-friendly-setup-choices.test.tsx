// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecordSetupChoices, SetupIdentity, SetupName } from '@/app/(studio)/design-studio/setup/choices';

// Actual friendly selection markup and browser form submission only. The server
// independently loads approved current pins and enforces grants/CAS/publication;
// these DOM checks are not tenant/permission/SQL/live acceptance evidence.
const pageId = '10000000-0000-4000-8000-000000000001';
const fieldId = '10000000-0000-4000-8000-000000000002';
const missingId = '10000000-0000-4000-8000-000000000003';
const pages = [{ id: pageId, name: 'Our service screen' }];
const fields = [{ id: fieldId, name: 'Customer purchase reference' }];
afterEach(cleanup);
function data(container: HTMLElement) {
  const form = container.querySelector('form'); if (!form) throw new Error('Missing form');
  return new FormData(form);
}

describe('friendly record setup choices', () => {
  it('distinguishes type inheritance from an explicit standard-screen override', () => {
    const { container, rerender } = render(<form><RecordSetupChoices pages={pages} fields={fields} inherit/></form>);
    expect((screen.getByRole('combobox', { name: 'Record screen' }) as HTMLSelectElement).value).toBe('inherit');
    expect(data(container).get('page')).toBe('inherit');
    rerender(<form key="standard"><RecordSetupChoices pages={pages} fields={fields} inherit page={null}/></form>);
    expect((screen.getByRole('combobox', { name: 'Record screen' }) as HTMLSelectElement).value).toBe('');
    expect(data(container).get('page')).toBe('');
  });
  it('uses the standard app screen for a base and submits only an explicitly chosen approved labelled screen', () => {
    const { container } = render(<form><RecordSetupChoices pages={pages} fields={fields}/></form>);
    const select = screen.getByRole('combobox', { name: 'Record screen' }); expect((select as HTMLSelectElement).value).toBe('');
    expect(screen.queryByRole('option', { name: /base screen/ })).toBeNull();
    fireEvent.change(select, { target: { value: pageId } }); expect(data(container).get('page')).toBe(pageId);
    expect((screen.getByRole('option', { name: 'Our service screen' }) as HTMLOptionElement).value).toBe(pageId);
  });
  it('preserves unavailable previously required selections without offering a control that can erase them', () => {
    const { container } = render(<form><RecordSetupChoices pages={pages} fields={fields} requiredFields={[fieldId, missingId]}/></form>);
    const checkbox = screen.getByRole('checkbox', { name: 'Customer purchase reference' }); expect((checkbox as HTMLInputElement).checked).toBe(true);
    expect(data(container).getAll('requiredField')).toEqual([fieldId, missingId]);
    expect(screen.getByText(/previously required field is unavailable/i)).not.toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    fireEvent.click(checkbox); expect(data(container).getAll('requiredField')).toEqual([missingId]);
    expect(container.textContent).not.toContain(missingId);
  });
  it('retains an unavailable previous screen rather than silently substituting the base or standard screen', () => {
    const { container } = render(<form><RecordSetupChoices pages={[]} fields={[]} page={pageId} inherit/></form>);
    expect((screen.getByRole('combobox', { name: 'Record screen' }) as HTMLSelectElement).value).toBe(pageId);
    expect((screen.getByRole('option', { name: /Previously selected screen/ }) as HTMLOptionElement).value).toBe(pageId);
    expect(data(container).get('page')).toBe(pageId); expect(container.textContent).not.toContain(pageId);
  });
  it('explains that base business rules remain and offers no technical keys, hashes, grants or expressions', () => {
    const { container } = render(<form><RecordSetupChoices pages={pages} fields={fields} requiredFields={[fieldId]}/><SetupName label="Hardware repair" help="For our workshop team"/></form>);
    expect(screen.getByText(/existing rules always apply/i)).not.toBeNull();
    expect((screen.getByRole('textbox', { name: 'Display name' }) as HTMLInputElement).value).toBe('Hardware repair');
    expect((screen.getByRole('textbox', { name: 'Helpful description' }) as HTMLTextAreaElement).value).toBe('For our workshop team');
    expect(container.textContent).not.toMatch(/stable key|schemaVersion|checksum|capability|expression|storageGeneration|definitionId/i);
    expect(container.textContent).not.toContain(fieldId); expect(container.textContent).not.toContain(pageId);
  });
  it('shows useful empty guidance and keeps submitted business/revision identity hidden rather than editable security controls', () => {
    const { container } = render(<form><RecordSetupChoices pages={[]} fields={[]}/><SetupIdentity business="selected-business" id={pageId} revision={7} kind="recordType"/></form>);
    expect(screen.getByText(/Create and publish an additional field/i)).not.toBeNull();
    expect(data(container).get('business')).toBe('selected-business'); expect(data(container).get('definitionId')).toBe(pageId); expect(data(container).get('revision')).toBe('7');
    expect(screen.queryByRole('textbox')).toBeNull(); expect(container.textContent).not.toContain('selected-business');
  });
});

it('keeps exact saved links until an explicit selection change, without exposing IDs in labels', () => {
  const live = { sourceHref: '/design-studio/current', whereUsedHref: '/design-studio/references/new' };
  const retained = { sourceHref: '/design-studio/saved', whereUsedHref: '/design-studio/references/old' };
  const { container } = render(<form><RecordSetupChoices pages={[{ ...pages[0], ...live }]} fields={[{ ...fields[0], ...live }]} page={pageId}
    requiredFields={[fieldId]} references={{ page: { id: pageId, ...retained }, requiredFields: [{ id: fieldId, ...retained }],
      baseProfile: { name: 'Workshop base', sourceHref: '/design-studio/setup/base', whereUsedHref: '/design-studio/references/base' } }}/></form>);
  expect(screen.getByRole('navigation', { name: 'Record screen references' }).querySelector('a:last-child')?.getAttribute('href')).toBe(retained.whereUsedHref);
  expect(screen.getByRole('navigation', { name: 'Customer purchase reference references' }).querySelector('a:last-child')?.getAttribute('href')).toBe(retained.whereUsedHref);
  expect(screen.getByText(/Based on Workshop base/)).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox', { name: 'Record screen' }), { target: { value: '' } });
  expect(screen.queryByRole('navigation', { name: 'Record screen references' })).toBeNull();
  fireEvent.change(screen.getByRole('combobox', { name: 'Record screen' }), { target: { value: pageId } });
  expect(screen.getByRole('navigation', { name: 'Record screen references' }).querySelector('a:last-child')?.getAttribute('href')).toBe(live.whereUsedHref);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Customer purchase reference' }));
  expect(screen.getByRole('navigation', { name: 'Customer purchase reference references' }).querySelector('a:last-child')?.getAttribute('href')).toBe(live.whereUsedHref);
  for (const link of container.querySelectorAll('a')) { expect(link.target).toBe('_blank'); expect(link.rel).toContain('noopener'); }
  expect(container.textContent).not.toContain(pageId);
});
it('does not substitute current-head links when saved reference metadata is denied or unavailable', () => {
  render(<RecordSetupChoices pages={[{ ...pages[0], sourceHref: '/design-studio/new', whereUsedHref: '/design-studio/references/new' }]}
    fields={[{ ...fields[0], sourceHref: '/design-studio/new' }]} page={pageId} requiredFields={[fieldId]}
    references={{ page: null, requiredFields: [] }}/>);
  expect(screen.queryByRole('link')).toBeNull();
});

it('keeps navigation available when editing is unavailable without enabling selection changes', () => {
  render(<RecordSetupChoices disabled pages={[{ ...pages[0], sourceHref: '/design-studio/screen' }]} fields={[]}
    page={pageId} references={{ page: { id: pageId, sourceHref: '/design-studio/saved', whereUsedHref: '/design-studio/references/saved' } }}/>);
  expect((screen.getByRole('combobox', { name: 'Record screen' }) as HTMLSelectElement).disabled).toBe(true);
  expect(screen.getByRole('link', { name: /Where used/ }).getAttribute('href')).toBe('/design-studio/references/saved');
});

it('preserves a validated saved screen absent from current choices and links only its retained version', () => {
  const { container } = render(<form><RecordSetupChoices pages={[]} fields={[]} page={pageId}
    references={{ page: { id: pageId, sourceHref: null, whereUsedHref: '/design-studio/references/retained?version=old' } }}/></form>);
  expect(data(container).get('page')).toBe(pageId);
  expect(screen.getByRole('link', { name: /Where used/ }).getAttribute('href')).toContain('version=old');
  expect(screen.queryByRole('link', { name: /Go to source/ })).toBeNull(); expect(container.textContent).not.toContain(pageId);
});
