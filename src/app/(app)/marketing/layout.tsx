import { ModuleSpace } from '@/components/shell/module-space';
import { marketingManifest } from '@/modules/marketing/manifest';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleSpace module={marketingManifest} wide chrome="quiet">{children}</ModuleSpace>;
}
