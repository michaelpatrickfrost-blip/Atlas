import { SalesProjectNew } from "@/modules/crm/components/sales-project-new";

export default function Page({ searchParams }: { searchParams: Promise<{ customer?: string; name?: string; value?: string }> }) {
  return <SalesProjectNew base="/sales/projects" searchParams={searchParams} />;
}
