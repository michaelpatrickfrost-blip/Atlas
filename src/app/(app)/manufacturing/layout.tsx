import { ConsoleSpace } from "@/modules/manufacturing/components/console-space";
import { manufacturingManifest } from "@/modules/manufacturing/manifest";

export default function ManufacturingLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleSpace module={manufacturingManifest}>{children}</ConsoleSpace>;
}
