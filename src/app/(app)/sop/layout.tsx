import type { ReactNode } from 'react';
import { ModuleSpace } from '@/components/shell/module-space';
import { sopManifest } from '@/modules/sop/manifest';
export default function Layout({children}:{children:ReactNode}){return <ModuleSpace module={sopManifest} wide chrome="quiet">{children}</ModuleSpace>;}
