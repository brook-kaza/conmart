// =============================================================================
// ConMart — Printable Proforma Invoice Page
// =============================================================================
// A clean, print-optimized view of a proforma invoice with bilingual
// English / Amharic rendering. Accessible by the buyer who owns the order.
// =============================================================================

import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getOrderByReference } from "@/app/actions/orders";
import { ProformaView } from "./proforma-view";

interface ProformaPageProps {
  params: Promise<{ code: string }>;
}

export default async function ProformaPage({ params }: ProformaPageProps) {
  const { code } = await params;

  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    redirect(`/login?redirect=/buyer/proforma/${code}`);
  }

  const order = await getOrderByReference(code);

  if (!order) {
    notFound();
  }

  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE ?? "+251 91 100 0000";

  return <ProformaView order={order} adminPhone={adminPhone} />;
}
