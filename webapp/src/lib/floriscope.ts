/** Best-effort Floriscope slug from a scientific name, e.g. "Quercus ilex" → quercus-ilex. */
export function floriscopeUrl(scientificName: string | null | undefined): string | null {
  if (!scientificName) return null;
  const slug = scientificName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `https://www.floriscope.io/plantes/${slug}` : null;
}
