import { TaxonForm } from "../../_components/taxon-form";

export default async function ModifierTaxonPage({
  params,
}: {
  params: Promise<{ especeId: string }>;
}) {
  const { especeId } = await params;
  return <TaxonForm mode="edit" especeId={decodeURIComponent(especeId)} />;
}
