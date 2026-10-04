import {DocumentList} from '@/modules/sales/components/document-list';
import type {SalesFilters} from '@/modules/sales/services/list-filters';

export default async function SalesDocuments({searchParams}:{searchParams:Promise<SalesFilters>}){
  const filters = await searchParams;
  return <DocumentList mode="document" filters={filters}/>;
}
