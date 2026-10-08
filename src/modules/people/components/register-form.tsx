import {Button} from '@/components/ui/button';
import {HRForm} from './hr-form';
import {Field,inputClass} from './platform-ui';
import {saveTraining,saveHRDocument} from '@/app/(app)/people/platform-actions';
type Employee={id:string;firstName:string;lastName:string};
type RecordData={id:string;employeeId:string;title:string;category:string|null;notes:string|null;version:number;status:string;provider?:string|null;required?:boolean;dueOn?:Date|null;completedOn?:Date|null;expiresOn?:Date|null;issuedOn?:Date|null;evidenceUrl?:string|null;url?:string|null};
export function RegisterForm({kind,employees,record,employeeId}:{kind:'training'|'document';employees:Employee[];record?:RecordData;employeeId?:string}){const training=kind==='training',d=(value?:Date|null)=>value?.toISOString().slice(0,10)??'';return <HRForm resetOnSuccess={!record} action={(training?saveTraining:saveHRDocument).bind(null,record?.id??null)} className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
 {record&&<input type="hidden" name="version" value={record.version}/>}
 <label className="text-sm">Employee{record?<><input type="hidden" name="employeeId" value={record.employeeId}/><p className="mt-1 rounded-lg bg-slate-50 p-2.5">{employees.find(e=>e.id===record.employeeId)?.firstName} {employees.find(e=>e.id===record.employeeId)?.lastName}</p></>:<select aria-label="Employee" className={inputClass} name="employeeId" defaultValue={employeeId??''} required><option value="">Choose employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select>}</label>
 <Field label={training?'Course or qualification':'Document title'} name="title" value={record?.title} required/>
 <Field label="Category" name="category" value={record?.category??(training?'Training':'Contract')} required maxLength={100}/>
 {training&&<Field label="Provider / awarding body" name="provider" value={record?.provider??''}/>}
 <label className="text-sm">Status<select aria-label="Status" name="status" className={inputClass} defaultValue={record?.status??(training?'PLANNED':'ACTIVE')}>{(training?['PLANNED','IN_PROGRESS','COMPLETED','CANCELLED']:['ACTIVE','ARCHIVED']).map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label>
 {training?<><Field label="Due date" name="dueOn" type="date" value={d(record?.dueOn)}/><Field label="Actual completion date" name="completedOn" type="date" value={d(record?.completedOn)}/><label className="flex items-center gap-2 text-sm"><input name="required" type="checkbox" defaultChecked={record?.required}/>Required for this employee</label></>:<Field label="Issue date" name="issuedOn" type="date" value={d(record?.issuedOn)}/>}
 <Field label="Expiry / renewal date" name="expiresOn" type="date" value={d(record?.expiresOn)}/>
 <Field label="Evidence link (HTTP/HTTPS)" name={training?'evidenceUrl':'url'} type="url" value={(training?record?.evidenceUrl:record?.url)??''} maxLength={2000}/>
 <label className="text-sm sm:col-span-2">{training?'Completion evidence and notes':'HR notes'}<textarea aria-label={training?"Completion evidence and notes":"HR notes"} name="notes" className={inputClass} defaultValue={record?.notes??''} rows={3} maxLength={8000}/></label>
 <p className="text-xs text-slate-500 sm:col-span-2">{training?'Complete only after checking actual attendance or qualification evidence. Expired records stay in history.':'Links reference documents held in your approved storage. This register does not upload files or verify legal eligibility.'}</p>
 <Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">{record?'Save changes':training?'Assign training':'Add document'}</Button>
 </HRForm>;}
