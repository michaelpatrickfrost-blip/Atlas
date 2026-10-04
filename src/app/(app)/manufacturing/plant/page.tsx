import Link from "next/link";
import { loadPlant } from "@/modules/manufacturing/services/plant";
import { PlantEditor } from "./plant-editor";

export default async function PlantPage() {
  const plant = await loadPlant();
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Plant</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Work centres and the machines inside them. A product step chooses one of these machines. Releasing a production order copies that machine onto the work order, so the schedule and the shop floor use the same plant.</p>
      </div>
      <Link href="/products" className="text-sm font-medium text-blue-600">Open products</Link>
    </div>
    <PlantEditor centres={plant.centres} canEdit={plant.canEdit} />
  </div>;
}
