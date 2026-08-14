/**
 * Adresse autocomplete via the official French public geocoding service
 * (IGN Géoplateforme / Base Adresse Nationale), no API key required.
 * https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/
 */
const GEOCODAGE_URL = "https://data.geopf.fr/geocodage/search";

interface GeocodageFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    label: string;
    city?: string;
    postcode?: string;
    context?: string;
    score: number;
  };
}

interface GeocodageResponse {
  features: GeocodageFeature[];
}

export interface AdresseSuggestion {
  label: string;
  city: string;
  postcode: string;
  context: string;
  score: number;
  lat: number;
  lng: number;
}

export async function searchAdresse(
  query: string,
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<AdresseSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    index: "address",
    limit: String(opts.limit ?? 5),
  });

  const res = await fetch(`${GEOCODAGE_URL}?${params}`, { signal: opts.signal });
  if (!res.ok) throw new Error(`Échec de la recherche d'adresse (${res.status})`);

  const data: GeocodageResponse = await res.json();
  return data.features.map((f) => ({
    label: f.properties.label,
    city: f.properties.city ?? "",
    postcode: f.properties.postcode ?? "",
    context: f.properties.context ?? "",
    score: f.properties.score,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
}
