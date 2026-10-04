"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CustomerCsvTools() {
  const handleDownloadTemplate = async (entity: string) => {
    const response = await fetch(`/api/import-template?entity=${entity}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atlas-${entity}-template.csv`;
      a.click();
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => handleDownloadTemplate("customers")}>
        Customer template →
      </Button>
      <Button variant="secondary" onClick={() => handleDownloadTemplate("contacts")}>
        Contacts template →
      </Button>
      <Link href="/settings/imports">
        <Button variant="secondary">Bulk import →</Button>
      </Link>
    </div>
  );
}
