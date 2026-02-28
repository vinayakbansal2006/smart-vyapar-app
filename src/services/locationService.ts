import { supabase } from './supabaseClient';
import type { NearbyStore } from '../types';

/**
 * Upsert user coordinates in the Supabase `user_profiles` table.
 * Expects columns: id (text PK), latitude (float8), longitude (float8), updated_at (timestamptz).
 */
export async function saveUserLocation(
  userId: string,
  lat: number,
  lng: number
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: userId,
        latitude: lat,
        longitude: lng,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('[locationService] Failed to save user location:', error.message);
    throw error;
  }
}

/**
 * Fetch stores nearest to the given coordinates.
 *
 * If a Supabase RPC `get_nearest_stores` exists (PostGIS),
 * it will be called. Otherwise falls back to a client-side
 * distance sort on the `stores` table.
 */
export async function fetchNearestStores(
  lat: number,
  lng: number,
  radiusKm: number = 25,
  limit: number = 10
): Promise<NearbyStore[]> {
  // ---- Try server-side RPC first (PostGIS function) ----
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_nearest_stores',
    { user_lat: lat, user_lng: lng, radius_km: radiusKm, max_results: limit }
  );

  if (!rpcError && Array.isArray(rpcData)) {
    return rpcData.map((s: any) => ({
      id: s.id,
      name: s.name,
      distance_km: s.distance_km,
      lat: s.latitude ?? s.lat,
      lng: s.longitude ?? s.lng,
      address: s.address,
      category: s.category,
    }));
  }

  // ---- Fallback: fetch all stores & compute Haversine client-side ----
  console.warn(
    '[locationService] RPC get_nearest_stores unavailable, falling back to client-side sort.',
    rpcError?.message
  );

  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id, name, latitude, longitude, address, category');

  if (storesError || !stores) {
    console.error('[locationService] Failed to fetch stores:', storesError?.message);
    return [];
  }

  return stores
    .map((s: any) => ({
      id: s.id as string,
      name: s.name as string,
      lat: Number(s.latitude),
      lng: Number(s.longitude),
      address: s.address as string | undefined,
      category: s.category as string | undefined,
      distance_km: haversineKm(lat, lng, Number(s.latitude), Number(s.longitude)),
    }))
    .filter((s) => s.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);
}

/** Haversine distance in kilometres. */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
