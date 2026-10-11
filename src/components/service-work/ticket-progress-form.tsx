import { updateWork } from '@/core/service-work/actions';
import { WORK_STATUSES } from '@/core/service-work/config';
import type { TicketFieldFormManifest } from '@/core/service-work/field-form-contract';
import { ActionForm } from '@/components/ui/action-form';
import { Select, TextArea, inputClass } from '@/components/ui/service-fields';
import { TicketConfiguredFields } from './configured-fields';
import { TicketBusinessTypeSelector } from './record-type-selector';
import type { RecordTypeSelection } from '@/core/studio/record-types/selection-contract';

export type TicketProgressFormProps = {
  work: { id: string; version: number; status: string; ownerUserId: string | null };
  owners: readonly { id: string; name: string }[];
  fieldManifest: TicketFieldFormManifest | null;
  recordTypeSelection?: RecordTypeSelection | null;
};
/** The existing owning progress form. Both native detail and an authorised Page
 * surface use its whole packet/native CAS action; presentation grants nothing. */
export function TicketProgressForm({ work, owners, fieldManifest, recordTypeSelection }: TicketProgressFormProps) {
  if (fieldManifest && (fieldManifest.operation !== 'update' || fieldManifest.recordRevision !== work.version))
    throw new Error('CONFLICT: the business form or ticket changed. Refresh before saving.');
  if (recordTypeSelection && (recordTypeSelection.recordId !== work.id || recordTypeSelection.recordRevision !== work.version))
    throw new Error('CONFLICT: the ticket or its business type changed. Refresh before saving.');
  return <><ActionForm action={updateWork} label="Update work">
    <input name="workId" type="hidden" value={work.id}/><input name="version" type="hidden" value={work.version}/>
    <Select title="Status" name="status" defaultValue={work.status} options={WORK_STATUSES}/>
    <label className="block text-xs">Owner<select className={inputClass} name="ownerUserId" defaultValue={work.ownerUserId ?? ''}><option value="">Unassigned</option>{owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></label>
    <TextArea title="Resolution / reason" name="reason"/>
    {fieldManifest && <TicketConfiguredFields key={fieldManifest.operationId} manifest={fieldManifest} recordId={work.id}/>}
  </ActionForm>{recordTypeSelection && <TicketBusinessTypeSelector key={recordTypeSelection.operationId} selection={recordTypeSelection}/>}</>;
}
