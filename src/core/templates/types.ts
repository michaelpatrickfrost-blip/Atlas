import type { Session } from '@/core/auth/session';
export type TemplateBlock = { id: string; type: 'heading' | 'text' | 'bullets' | 'table' | 'signature' | 'divider' | 'pageBreak'; text: string };
export type TemplateRecord = { id: string; type: string; label: string; href: string; partyId: string | null; contactId?: string | null; fields: Record<string,string> };
export type TemplateContextProvider = {
  types: { id: string; label: string; capability: string }[];
  list: (session: Session, type: string) => Promise<TemplateRecord[]>;
  get: (session: Session, type: string, id: string) => Promise<TemplateRecord | null>;
};
export const MERGE_FIELDS = ['company.name','customer.name','customer.code','customer.address','contact.name','contact.email','record.name','record.reference','record.value','record.currency','record.date','date.today'] as const;
export const TARGET_MODULES = ['crm','sales','projects','service'] as const;
