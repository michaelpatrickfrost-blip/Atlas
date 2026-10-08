import type {ReactNode} from 'react';
import {ModuleSpace} from '@/components/shell/module-space';
import {fleetManifest} from '@/modules/fleet/manifest';
export default function Layout({children}:{children:ReactNode}){return <ModuleSpace module={fleetManifest} wide chrome="quiet">{children}</ModuleSpace>;}
