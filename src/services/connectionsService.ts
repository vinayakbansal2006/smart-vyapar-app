import { supabase } from '../backend/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface ConnectionRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_role: string;
  receiver_role: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: string;
  name: string | null;
  shop_name: string | null;
  role: string | null;
  city: string | null;
  avatar_url: string | null;
}

// ─── Follow / Accept / Unfollow ──────────────────────────────────────────────

/**
 * Send a follow request to another business.
 */
export async function followBusiness(
  senderId: string,
  receiverId: string,
  senderRole: string,
  receiverRole: string
): Promise<ConnectionRow> {
  const { data, error } = await supabase
    .from('connections')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      sender_role: senderRole,
      receiver_role: receiverRole,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error) {
    console.error('[connectionsService] followBusiness failed:', error.message);
    throw error;
  }
  return data as ConnectionRow;
}

/**
 * Accept an incoming follow request.
 */
export async function acceptConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
    .eq('id', connectionId);

  if (error) {
    console.error('[connectionsService] acceptConnection failed:', error.message);
    throw error;
  }
}

/**
 * Reject an incoming follow request.
 */
export async function rejectConnection(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
    .eq('id', connectionId);

  if (error) {
    console.error('[connectionsService] rejectConnection failed:', error.message);
    throw error;
  }
}

/**
 * Remove a connection (unfollow).
 */
export async function unfollowBusiness(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId);

  if (error) {
    console.error('[connectionsService] unfollowBusiness failed:', error.message);
    throw error;
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch all connections where the user is follower or following.
 */
export async function fetchConnections(
  userId: string
): Promise<ConnectionRow[]> {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[connectionsService] fetchConnections failed:', error.message);
    return [];
  }
  return (data ?? []) as ConnectionRow[];
}

/**
 * Search for businesses by name, shop_name, or ID. Live search.
 */
export async function searchBusinesses(
  query: string,
  excludeId: string
): Promise<BusinessProfile[]> {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, name, shop_name, role, city, avatar_url')
    .neq('id', excludeId)
    .or(`name.ilike.%${query}%,shop_name.ilike.%${query}%,id.ilike.%${query}%`)
    .limit(15);

  if (error) {
    console.error('[connectionsService] searchBusinesses failed:', error.message);
    return [];
  }
  return (data ?? []) as BusinessProfile[];
}

/**
 * Fetch profile info for a list of user IDs (to display names/shops).
 */
export async function fetchProfilesByIds(
  ids: string[]
): Promise<BusinessProfile[]> {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, name, shop_name, role, city, avatar_url')
    .in('id', ids);

  if (error) {
    console.error('[connectionsService] fetchProfilesByIds failed:', error.message);
    return [];
  }
  return (data ?? []) as BusinessProfile[];
}

// ─── Real-time subscription ──────────────────────────────────────────────────

/**
 * Fetch recommended businesses for the user: businesses they don't follow yet,
 * optionally filtered by city or complementary role.
 */
export async function fetchRecommendedBusinesses(
  userId: string,
  userCity: string,
  userRole: string,
  excludeIds: string[],
  limit = 10
): Promise<BusinessProfile[]> {
  // Get businesses from the same city or complementary roles
  let query = supabase
    .from('user_profiles')
    .select('id, name, shop_name, role, city, avatar_url')
    .neq('id', userId)
    .limit(limit);

  // Exclude already-connected IDs
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  // Prefer same city
  if (userCity) {
    query = query.ilike('city', `%${userCity}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[connectionsService] fetchRecommendedBusinesses failed:', error.message);
    // Fallback: fetch without city filter
    const { data: fallbackData } = await supabase
      .from('user_profiles')
      .select('id, name, shop_name, role, city, avatar_url')
      .neq('id', userId)
      .not('id', 'in', excludeIds.length > 0 ? `(${excludeIds.join(',')})` : '()')
      .limit(limit);
    return (fallbackData ?? []) as BusinessProfile[];
  }
  return (data ?? []) as BusinessProfile[];
}

/**
 * Subscribe to real-time changes on the connections table
 * for a given user. Returns an unsubscribe function.
 */
export function subscribeToConnections(
  userId: string,
  onUpdate: (connections: ConnectionRow[]) => void
): () => void {
  const channel = supabase
    .channel('connections-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'connections',
      },
      async () => {
        // Re-fetch all connections on any change
        const fresh = await fetchConnections(userId);
        onUpdate(fresh);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
