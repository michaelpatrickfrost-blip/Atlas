import type {ReactNode} from 'react';
import {ModuleSpace} from '@/components/shell/module-space';
import {fieldserviceManifest} from '@/modules/fieldservice/manifest';
export default function Layout({children}:{children:ReactNode}){return <ModuleSpace module={fieldserviceManifest} wide chrome="quiet">{children}</ModuleSpace>;}
