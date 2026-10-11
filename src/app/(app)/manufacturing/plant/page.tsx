import Link from "next/link";
import { loadPlant } from "@/modules/manufacturing/services/plant";
import { PlantEditor } from "./plant-editor";

export default async function PlantPage() {
  const plant = await loadPlant();
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Manufacturing &amp; Supply</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Plant &amp; machines</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Your machines, production lines and equipment in one connected plant. Configure operating calendars and downtime here; product routings define the eligible machines, load sizes and cycle times used by production.</p>
      </div>
      <Link href="/products" className="text-sm font-medium text-blue-600">Open products</Link>
    </div>
    <PlantEditor centres={plant.centres} downtime={plant.downtime} canEdit={plant.canEdit} />
  </div>;
}
