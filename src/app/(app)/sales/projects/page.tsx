import { SalesProjectList } from "@/modules/crm/components/sales-project-list";

export default function Page({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string; customer?: string }> }) {
  return <SalesProjectList base="/sales/projects" searchParams={searchParams} />;
}
