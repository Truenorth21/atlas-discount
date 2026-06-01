import { QuoteDetailClient } from "./quote-detail-client";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuoteDetailClient id={id} />;
}
