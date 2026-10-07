import { WorkDetail } from "@/components/service-work/work-detail";
export default async function Ticket({ params }: { params: Promise<{ ticketId: string }> }) { return <WorkDetail id={(await params).ticketId}/>; }
