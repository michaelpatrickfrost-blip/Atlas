import {requireSession} from "@/core/auth/session";
import {SourceGoals} from "@/modules/kpis/components/source-goals";
import {DocumentList} from '@/modules/sales/components/document-list';
import type {SalesFilters} from '@/modules/sales/services/list-filters';

export default async function SalesDocuments({searchParams}:{searchParams:Promise<SalesFilters>}){
  const session=await requireSession();const filters = await searchParams;
  return <div className="space-y-5"><SourceGoals session={session} prefixes={["sales."]}/><DocumentList mode="document" filters={filters}/></div>;
}
