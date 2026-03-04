import { supabase } from '../backend/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: 'connection' | 'expense' | 'stock' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ─── Real-time notification subscriptions ────────────────────────────────────

/**
 * Subscribe to connection changes for the user (new follows, accepts).
 * Returns an unsubscribe function.
 */
export function subscribeToConnectionNotifications(
  userId: string,
  onNotification: (notif: AppNotification) => void
): () => void {
  const channel = supabase
    .channel('notif-connections')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'connections',
      },
      (payload) => {
        const row = payload.new as any;
        // Someone followed us
        if (row.following_id === userId && row.follower_id !== userId) {
          onNotification({
            id: `notif_conn_${row.id}`,
            type: 'connection',
            title: 'New Follower',
            message: `A business (${row.follower_id.slice(0, 12)}…) started following you`,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'connections',
      },
      (payload) => {
        const row = payload.new as any;
        if (row.status === 'ACCEPTED' && row.follower_id === userId) {
          onNotification({
            id: `notif_accept_${row.id}`,
            type: 'connection',
            title: 'Follow Accepted',
            message: `Your follow request was accepted by ${row.following_id.slice(0, 12)}…`,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to expense changes for the user.
 * Returns an unsubscribe function.
 */
export function subscribeToExpenseNotifications(
  userId: string,
  onNotification: (notif: AppNotification) => void
): () => void {
  const channel = supabase
    .channel('notif-expenses')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'expenses',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as any;
        onNotification({
          id: `notif_exp_${row.id}`,
          type: 'expense',
          title: 'Expense Recorded',
          message: `₹${Number(row.amount).toLocaleString()} for ${row.category}${row.description ? ` – ${row.description}` : ''}`,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'expenses',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onNotification({
          id: `notif_exp_del_${Date.now()}`,
          type: 'expense',
          title: 'Expense Deleted',
          message: 'An expense was removed from your records',
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Generate stock-level notifications from local inventory data.
 */
export function checkStockNotifications(
  inventory: Array<{ id: string; name: string; currentStock: number; minThreshold: number; status: string }>
): AppNotification[] {
  const notifications: AppNotification[] = [];
  
  inventory.forEach(item => {
    if (item.status === 'CRITICAL') {
      notifications.push({
        id: `notif_stock_crit_${item.id}`,
        type: 'stock',
        title: 'Critical Stock Alert',
        message: `${item.name} is critically low (${item.currentStock} remaining)`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    } else if (item.status === 'LOW') {
      notifications.push({
        id: `notif_stock_low_${item.id}`,
        type: 'stock',
        title: 'Low Stock Warning',
        message: `${item.name} is running low (${item.currentStock} remaining, min: ${item.minThreshold})`,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }
  });

  return notifications;
}
