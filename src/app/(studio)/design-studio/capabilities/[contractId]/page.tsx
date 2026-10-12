import { requireSession } from '@/core/auth/session';
import { STUDIO_CAPABILITIES } from '@/core/studio/permissions';
import { withStudioAuthoringAuthority } from '@/core/studio/authoring/context';
import { parseNativeDesignReferenceLocation } from '@/core/studio/authoring/native-reference-links';
import { readNativeDesignReferenceInTransaction } from '@/core/studio/authoring/native-reference-navigation';
import { NativeReferencePanel } from '@/components/studio/native-reference';

export default async function NativeReferenceReview({ params, searchParams }: {
  params: Promise<{ contractId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireSession(), { contractId } = await params;
  const location = parseNativeDesignReferenceLocation(contractId, await searchParams);
  const model = await withStudioAuthoringAuthority(actor, STUDIO_CAPABILITIES.read, location.business,
    authority => readNativeDesignReferenceInTransaction(authority, location.request,
      location.business === undefined ? {} : { business: location.business }, location.usage ? 'usage' : 'source'));
  const workspaceHref = `/design-studio${location.business ? `?business=${encodeURIComponent(location.business)}` : ''}`;
  return <NativeReferencePanel model={model} workspaceHref={workspaceHref}/>;
}
