import { WorkList } from "@/components/service-work/work-list";
export default async function Queries({ searchParams }: { searchParams: Promise<{ q?: string; mine?: string; queueId?: string; status?: string }> }) { return <WorkList kind="QUERY" filters={await searchParams}/>; }
