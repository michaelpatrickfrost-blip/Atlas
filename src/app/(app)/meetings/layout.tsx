import type {ReactNode} from 'react';
import {ModuleSpace} from '@/components/shell/module-space';
import {meetingsManifest} from '@/modules/meetings/manifest';
export default function Layout({children}:{children:ReactNode}){return <ModuleSpace module={meetingsManifest} wide chrome="quiet">{children}</ModuleSpace>;}
