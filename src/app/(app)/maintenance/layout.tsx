import type {ReactNode} from 'react';
import {ModuleSpace} from '@/components/shell/module-space';
import {maintenanceManifest} from '@/modules/maintenance/manifest';
export default function Layout({children}:{children:ReactNode}){return <ModuleSpace module={maintenanceManifest} wide chrome="quiet">{children}</ModuleSpace>;}
