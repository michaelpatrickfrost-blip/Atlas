import { redirect, notFound } from "next/navigation";
import { getSession } from "@/core/auth/session";
import { publicBusinessAddress } from "@/core/auth/business-address";
export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const company=await publicBusinessAddress((await params).slug);if(!company)notFound();
  const session=await getSession();
  redirect(session?.organisationId === company.id ? "/home" : `/business/${company.slug}/login`);
}
