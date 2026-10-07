import { WorkList } from "@/components/service-work/work-list";
export default async function Tickets({ searchParams }: { searchParams: Promise<{ q?: string; mine?: string; queueId?: string; status?: string; type?: string; breach?: string }> }) { return <WorkList filters={await searchParams}/>; }
