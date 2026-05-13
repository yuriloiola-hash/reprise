/**
 * Monta URLs de navegação para o endereço do médico.
 */
export function buildGpsLinks(medico: {
  google_place_id?: string | null;
  clinica?: string | null;
  local_complexo?: string | null;
  sala_andar?: string | null;
  nome: string;
}) {
  const {
    google_place_id,
    clinica,
    local_complexo,
    sala_andar,
    nome,
  } = medico;

  // ── Google Maps com Place ID (abre o pin exato do complexo) ──
  const googleMapsPlaceId = google_place_id
    ? `https://www.google.com/maps/place/?q=place_id:${google_place_id}`
    : null;

  // ── Google Maps com query de texto (fallback) ──
  const textQuery = [clinica, local_complexo, sala_andar]
    .filter(Boolean)
    .join(', ');
    
  const googleMapsText = `https://www.google.com/maps/search/?api=1&query=${
    encodeURIComponent(textQuery || nome)
  }`;

  // ── URL Universal (resolve automaticamente no device) ──
  const universalLink = google_place_id
    ? `comgooglemaps://?q=${encodeURIComponent(clinica || nome)}&place_id=${google_place_id}`
    : `maps://maps.apple.com/?q=${encodeURIComponent(textQuery || nome)}`;

  // ── Apple Maps (iOS nativo, sem app externo) ──
  const appleMaps = `https://maps.apple.com/?q=${encodeURIComponent(textQuery || nome)}`;

  return {
    googleMaps: googleMapsPlaceId ?? googleMapsText,
    googleMapsText,
    appleMaps,
    universalLink,
  };
}
