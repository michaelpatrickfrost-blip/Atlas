"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSalesProjectAction } from "./actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewSalesProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    potentialValueAmount: 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createSalesProjectAction({
        name: form.name,
        description: form.description,
        potentialValueAmount:
          form.potentialValueAmount > 0 ? form.potentialValueAmount * 100 : undefined,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.projectId) {
        router.push(`/crm/projects/${result.projectId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/crm/projects"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <h1 className="text-2xl font-semibold">New Sales Project</h1>
        <p className="text-sm text-gray-600 mt-1">
          A sales project is a commercial container for complex, multi-organisation deals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase">Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Northgate Distribution Centre"
              required
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Project overview, scope, key stakeholders..."
              rows={4}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase">Estimated Project Value (£)</label>
            <input
              type="number"
              value={form.potentialValueAmount || ""}
              onChange={(e) =>
                setForm({ ...form, potentialValueAmount: parseFloat(e.target.value) || 0 })
              }
              placeholder="e.g. 420000"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading || !form.name}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
          <Link href="/crm/projects">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
