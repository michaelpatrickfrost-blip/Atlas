import { WorkDetail } from "@/components/service-work/work-detail";
export default async function Query({ params }: { params: Promise<{ workId: string }> }) { return <WorkDetail kind="QUERY" id={(await params).workId}/>; }
