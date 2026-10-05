import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { db } from '@/core/db/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function EditProjectPage({ params }: { params: { projectId: string } }) {
  const session = await requireSession();
  await assertCapability(session, 'sales.opportunityManage');

  const project = await db.salesProject.findUnique({
    where: { id: params.projectId },
  });

  if (!project || project.organisationId !== session.organisationId) {
    return <div>Not found</div>;
  }

  return (
    <div className="space-y-6">
      <Link href={`/crm/projects/${project.id}`}>
        <Button variant="secondary"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      </Link>

      <h1 className="text-3xl font-bold">Edit Project</h1>

      <form className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">Project Name</label>
          <input type="text" defaultValue={project.name} className="w-full px-3 py-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stage</label>
          <select defaultValue={project.stage} className="w-full px-3 py-2 border rounded">
            <option>IDENTIFIED</option>
            <option>QUALIFIED</option>
            <option>SPECIFICATION</option>
            <option>ESTIMATING</option>
            <option>QUOTING</option>
            <option>NEGOTIATION</option>
            <option>PREFERRED</option>
            <option>AWARDED</option>
            <option>LIVE</option>
            <option>COMPLETED</option>
          </select>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Organisations</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <p className="text-sm">Add organisations & roles (END_CLIENT, CONTRACTOR, etc.)</p>
              <Button variant="secondary">Add</Button>
            </div>
          </div>
        </div>

        <Button>Save Project</Button>
      </form>
    </div>
  );
}
