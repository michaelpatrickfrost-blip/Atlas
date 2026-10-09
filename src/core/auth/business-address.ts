import { db } from "@/core/db/client";
export async function publicBusinessAddress(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return null;
  return db.organisation.findFirst({ where: { slug, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null }, select: { id: true, name: true, slug: true } });
}
