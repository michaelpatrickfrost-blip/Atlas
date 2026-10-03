import {DocumentList} from '@/modules/sales/components/document-list';
import type {SalesFilters} from '@/modules/sales/services/list-filters';
export default async function Orders({searchParams}:{searchParams:Promise<SalesFilters>}){return <DocumentList mode="order" filters={await searchParams}/>;}
