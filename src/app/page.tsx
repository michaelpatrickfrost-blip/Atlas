import { getSession } from "@/core/auth/session";
import { AtlasWebsite } from '@/components/website/atlas-website';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Atlas — Plan. Make. Deliver.', description: 'A connected business operating system for customers, operations, people, finance and planning. Private access for existing Atlas users.' };

export default async function RootPage() {
  const session = await getSession();
  return <AtlasWebsite signedIn={!!session} />;
}
