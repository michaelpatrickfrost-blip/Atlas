import { notFound } from "next/navigation";
import { AuthFrame } from "@/components/shell/auth-frame";
import { ResetForm } from "@/app/(auth)/reset-password/reset-form";
import { publicBusinessAddress } from "@/core/auth/business-address";
export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const company=await publicBusinessAddress((await params).slug);if(!company)notFound();
  return <AuthFrame title={`Set your password for ${company.name}`} subtitle="Use the single-use code provided for this business."><ResetForm companySlug={company.slug}/></AuthFrame>;
}
