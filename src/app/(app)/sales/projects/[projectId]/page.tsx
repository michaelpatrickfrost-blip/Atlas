import { SalesProjectDetail } from "@/modules/crm/components/sales-project-detail";

export default function Page({ params }: { params: Promise<{ projectId: string }> }) {
  return <SalesProjectDetail base="/sales/projects" params={params} />;
}
