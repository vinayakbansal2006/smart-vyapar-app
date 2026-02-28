import { useEffect, useRef, useCallback } from 'react';
import type { AppState, GeolocationStatus } from '../types';
import { saveUserLocation, fetchNearestStores } from '../services/locationService';
import { reverseGeocode } from '../services/geocodeService';

/**
 * Custom hook that:
 * 1. Requests geolocation via `navigator.geolocation.getCurrentPosition`
 * 2. Stores lat/lng in AppState.location
 * 3. Persists coordinates to the Supabase `user_profiles` table
 * 4. Handles permission denial gracefully (sets status to 'denied')
 * 5. Triggers `fetchNearestStores()` once coordinates are available
 *
 * The hook fires once after the user is logged in.
 */
export function useGeolocation(
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>
) {
  const hasFired = useRef(false);

  const requestLocation = useCallback(() => {
    // Guard: only run once and when user is authenticated
    if (hasFired.current || !state.isLoggedIn) return;
    hasFired.current = true;

    if (!navigator.geolocation) {
      console.warn('[useGeolocation] Geolocation API not available in this browser.');
      setState((s) => ({ ...s, geolocationStatus: 'unavailable' as GeolocationStatus }));
      return;
    }

    // Mark as requesting
    setState((s) => ({ ...s, geolocationStatus: 'requesting' as GeolocationStatus }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update state with coordinates
        setState((s) => ({
          ...s,
          geolocationStatus: 'granted' as GeolocationStatus,
          location: {
            ...(s.location ?? { state: '', city: '' }),
            lat: latitude,
            lng: longitude,
          },
        }));

        // Reverse geocode to auto-fill profile city, state, address
        try {
          const geo = await reverseGeocode(latitude, longitude);
          setState((s) => ({
            ...s,
            location: {
              ...(s.location ?? { lat: latitude, lng: longitude }),
              lat: latitude,
              lng: longitude,
              city: geo.city || s.location?.city || '',
              state: geo.state || s.location?.state || '',
            },
            profile: {
              ...s.profile,
              city: s.profile.city || geo.city,
              state: s.profile.state || geo.state,
              address: s.profile.address || geo.area,
            },
          }));
        } catch {
          console.warn('[useGeolocation] Reverse geocoding failed.');
        }

        // Persist to Supabase (fire-and-forget with error logging)
        try {
          await saveUserLocation(state.profile.id, latitude, longitude);
        } catch {
          // Non-blocking – location is still usable locally
          console.warn('[useGeolocation] Could not persist location to Supabase.');
        }

        // Fetch nearest stores
        try {
          const stores = await fetchNearestStores(latitude, longitude);
          setState((s) => ({ ...s, nearestStores: stores }));
        } catch {
          console.warn('[useGeolocation] Could not fetch nearest stores.');
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.info('[useGeolocation] User denied geolocation permission.');
            setState((s) => ({ ...s, geolocationStatus: 'denied' as GeolocationStatus }));
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn('[useGeolocation] Position unavailable.');
            setState((s) => ({ ...s, geolocationStatus: 'unavailable' as GeolocationStatus }));
            break;
          case error.TIMEOUT:
            console.warn('[useGeolocation] Geolocation request timed out.');
            setState((s) => ({ ...s, geolocationStatus: 'error' as GeolocationStatus }));
            break;
          default:
            console.warn('[useGeolocation] Unknown geolocation error:', error.message);
            setState((s) => ({ ...s, geolocationStatus: 'error' as GeolocationStatus }));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 5 * 60_000, // cache for 5 min
      }
    );
  }, [state.isLoggedIn, state.profile.id, setState]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);
}
