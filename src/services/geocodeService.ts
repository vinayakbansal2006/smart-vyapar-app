/**
 * Reverse-geocode lat/lng into a human-readable address
 * using the free OpenStreetMap Nominatim API.
 *
 * Returns city, state, area (suburb/neighbourhood) and a
 * formatted display address.
 */
export interface ReverseGeoResult {
  city: string;
  state: string;
  area: string;       // suburb / neighbourhood / village
  postcode: string;
  country: string;
  displayAddress: string;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeoResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Vyaparika-InventoryApp/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Nominatim reverse geocode failed: ${res.status}`);
  }

  const data = await res.json();
  const addr = data.address ?? {};

  // Nominatim returns different keys depending on specificity
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    '';

  const state =
    addr.state ||
    addr.state_district ||
    '';

  const area =
    addr.suburb ||
    addr.neighbourhood ||
    addr.hamlet ||
    addr.locality ||
    addr.road ||
    '';

  const postcode = addr.postcode || '';
  const country = addr.country || 'India';

  // Build a short display address
  const parts = [area, city, state].filter(Boolean);
  const displayAddress = parts.join(', ') + (postcode ? ` - ${postcode}` : '');

  return { city, state, area, postcode, country, displayAddress };
}
