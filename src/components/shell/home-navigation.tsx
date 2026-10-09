import type { Session } from '@/core/auth/session';
import { can } from '@/core/permissions/check';
import { CORE_CAPABILITIES } from '@/core/permissions/capabilities';
import { canOpenCompanyAdmin } from '@/app/(app)/settings/settings-menu';
import { WorkspaceNavigation } from './workspace-navigation';
/** Workspace utilities only. Business apps live in the central directory. */
export async function HomeNavigation({session}:{session:Session}){
 return <WorkspaceNavigation links={[
 {name:'Home',href:'/home'},{name:'Reports',href:'/reports'},{name:'My tasks',href:'/profile#assigned'},
 ...(can(session,CORE_CAPABILITIES.chatRead)?[{name:'Messages' as const,href:'/chat'}]:[]),
 ...(canOpenCompanyAdmin(session)?[{name:'Settings' as const,href:'/settings'}]:[]),
 ]}/>;
}
