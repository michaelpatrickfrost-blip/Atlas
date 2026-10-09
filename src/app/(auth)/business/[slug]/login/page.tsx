import { notFound } from "next/navigation";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { AuthFrame } from "@/components/shell/auth-frame";
import { publicBusinessAddress } from "@/core/auth/business-address";
export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const company=await publicBusinessAddress((await params).slug);if(!company)notFound();
  return <AuthFrame title={`Sign in to ${company.name}`} subtitle="Your account must have access to this business." footer="Use the username and password provided by your administrator."><LoginForm companySlug={company.slug}/></AuthFrame>;
}
