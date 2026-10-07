export const CASE_TYPES = ['GENERAL_ENQUIRY','TECHNICAL_ENQUIRY','DELIVERY_ISSUE','PRODUCT_ISSUE','PRICING_ISSUE','INVOICE_ISSUE','DOCUMENTATION','RETURN_REQUEST','WARRANTY','SERVICE_REQUEST','QUERY','COMPLAINT','ORDER_QUERY','DELIVERY_QUERY','INVOICE_QUERY','CREDIT_QUERY','PRODUCT_QUERY','QUALITY_COMPLAINT','SHORTAGE','DAMAGED_GOODS','RETURN','PRICING_QUERY','ACCOUNT_QUERY','EXPORT_QUERY','TECHNICAL_QUERY','REQUEST','FEEDBACK','COMPLIMENT','OTHER'] as const;
export const PRIORITIES = ['CRITICAL','HIGH','NORMAL','LOW'] as const;
export const SEVERITIES = ['SEV1','SEV2','SEV3','SEV4'] as const;
export const CHANNELS = ['EMAIL','PHONE','WEB_FORM','CUSTOMER_PORTAL','LIVE_CHAT','MANUAL','SALES','INTERNAL','SOCIAL','API'] as const;
export const ACTIVE_STATUSES = ['NEW','TRIAGE','OPEN','IN_PROGRESS','WAITING_INTERNAL','WAITING_CUSTOMER','WAITING_SUPPLIER'] as const;
export const CASE_STATUSES = [...ACTIVE_STATUSES,'RESOLVED','CLOSED','CANCELLED'] as const;
export const TICKET_STATUSES = ['QUEUED','ASSIGNED','IN_PROGRESS','WAITING_INFORMATION','COMPLETE','REJECTED','CANCELLED'] as const;
export const RESOLUTION_CODES = ['INFORMATION_PROVIDED','ORDER_CORRECTED','INVOICE_CORRECTED','CREDIT_ISSUED','REPLACEMENT','RETURN','DELIVERY_COMPLETED','NO_FAULT_FOUND','CUSTOMER_ERROR','GOODWILL','DUPLICATE','CANCELLED'] as const;
export function choice<T extends readonly string[]>(value: string, choices: T): T[number] {
  if (!choices.includes(value)) throw new Error('Choose a valid option.');
  return value as T[number];
}
export function label(value: string) { return value.toLowerCase().replaceAll('_',' ').replace(/^./,c=>c.toUpperCase()); }
export function isComplaint(type: string) { return ['COMPLAINT','QUALITY_COMPLAINT'].includes(type); }
export function validateTransition(current: string, target: string, input: {openTickets: number; resolution?: string; code?: string; rootCause?: string; complaint: boolean; reason?: string}) {
  choice(target, CASE_STATUSES);
  if(current===target) throw new Error('The case already has this status.');
  if(['RESOLVED','CLOSED','CANCELLED'].includes(current) && !['OPEN','CLOSED'].includes(target)) throw new Error('Reopen this case before changing its workflow.');
  if(target==='CLOSED' && current!=='RESOLVED') throw new Error('Resolve the case before closing it.');
  if(target==='RESOLVED') {
    if(input.openTickets) throw new Error('Complete or explicitly cancel all departmental dependencies before resolution.');
    if(!input.resolution?.trim() || !input.code) throw new Error('Resolution code and summary are required.');
    choice(input.code, RESOLUTION_CODES);
  }
  if(target==='CLOSED') {
    if(input.openTickets) throw new Error('Departmental work remains open.');
    if(input.complaint && !input.rootCause?.trim()) throw new Error('Record the root cause before closing a complaint.');
    if(!input.reason?.trim()) throw new Error('Record customer acceptance or the closure reason.');
  }
  if((target==='OPEN' && ['RESOLVED','CLOSED','CANCELLED'].includes(current)) || target==='CANCELLED') {
    if(!input.reason?.trim()) throw new Error('A reason is required.');
    if(target==='CANCELLED' && input.openTickets) throw new Error('Cancel open departmental work explicitly first.');
  }
}
export function nextAction(c: {status:string;customerUpdateDueAt:Date|null}, tickets: {status:string;dueAt:Date;completedAt:Date|null}[], lastUpdate:Date|null, now=new Date()) {
  if(['CLOSED','CANCELLED'].includes(c.status)) return 'No open action';
  if(tickets.some(t=>t.status==='COMPLETE' && t.completedAt && (!lastUpdate || t.completedAt>lastUpdate))) return 'Update customer — department response ready';
  if(c.customerUpdateDueAt && c.customerUpdateDueAt<now) return 'Promised customer update overdue';
  if(tickets.some(t=>!['COMPLETE','CANCELLED'].includes(t.status) && t.dueAt<now)) return 'Chase overdue departmental dependency';
  if(c.status==='RESOLVED') return 'Confirm customer acceptance before closure';
  return c.status==='NEW' ? 'Triage and acknowledge customer' : 'Continue investigation';
}
