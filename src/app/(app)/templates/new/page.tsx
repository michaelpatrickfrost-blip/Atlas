import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { TemplateEditor } from '@/modules/templates/components/editor';
export default async function Page(){const s=await requireSession();assertCapability(s,'core.contract.manage');return <TemplateEditor/>;}
