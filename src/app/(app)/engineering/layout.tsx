import type {ReactNode} from 'react';
import {ModuleSpace} from '@/components/shell/module-space';
import {engineeringManifest} from '@/modules/engineering/manifest';
export default function Layout({children}:{children:ReactNode}){return <ModuleSpace module={engineeringManifest} wide chrome="quiet">{children}</ModuleSpace>;}
