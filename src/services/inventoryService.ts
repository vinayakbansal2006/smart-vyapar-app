/**
 * Inventory Service
 * ─────────────────
 * Manages SKU (Stock Keeping Unit) CRUD and stock movement logging.
 * All operations persisted to Supabase `user_inventory` and `stock_logs` tables.
 */

import { supabase } from '../backend/supabase';
import type { SKU, StockLog, MovementType } from '../types';

// ─── Inventory CRUD ──────────────────────────────────────────────

/**
 * Fetch all SKUs for a user, ordered by most recently updated.
 */
export async function fetchInventory(userId: string): Promise<SKU[]> {
  try {
    const { data, error } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('[inventoryService] fetchInventory failed:', error.message);
      return [];
    }
    return (data ?? []).map(rowToSku);
  } catch (err) {
    console.error('[inventoryService] fetchInventory exception:', err);
    return [];
  }
}

/**
 * Fetch a single SKU by ID
 */
export async function fetchSkuById(skuId: string): Promise<SKU | null> {
  try {
    const { data, error } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('id', skuId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('[inventoryService] fetchSkuById failed:', error.message);
      return null;
    }
    return data ? rowToSku(data) : null;
  } catch (err) {
    console.error('[inventoryService] fetchSkuById exception:', err);
    return null;
  }
}

/**
 * Add a new SKU/product to inventory
 */
export async function addSku(
  userId: string,
  sku: Omit<SKU, 'id' | 'lastUpdated' | 'totalIn' | 'totalOut' | 'currentStock' | 'status'>
): Promise<SKU> {
  const id = 'SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  try {
    const { data, error } = await supabase
      .from('user_inventory')
      .insert({
        id,
        user_id: userId,
        name: sku.name,
        category: sku.category,
        unit: sku.unit,
        price: sku.price || 0,
        opening_stock: sku.openingStock || 0,
        total_in: 0,
        total_out: 0,
        current_stock: sku.openingStock || 0,
        min_threshold: sku.minThreshold || 5,
        status: 'OPTIMAL',
        expiry_date: sku.expiryDate || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[inventoryService] addSku failed:', error.message);
      throw error;
    }
    return rowToSku(data);
  } catch (err) {
    console.error('[inventoryService] addSku exception:', err);
    throw err;
  }
}

/**
 * Update SKU details (name, price, threshold, expiry)
 */
export async function updateSku(skuId: string, updates: Partial<SKU>): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_inventory')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.minThreshold && { min_threshold: updates.minThreshold }),
        ...(updates.expiryDate && { expiry_date: updates.expiryDate }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', skuId);

    if (error) {
      console.error('[inventoryService] updateSku failed:', error.message);
      throw error;
    }
  } catch (err) {
    console.error('[inventoryService] updateSku exception:', err);
    throw err;
  }
}

/**
 * Delete a SKU entirely
 */
export async function deleteSku(skuId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_inventory')
      .delete()
      .eq('id', skuId);

    if (error) {
      console.error('[inventoryService] deleteSku failed:', error.message);
      throw error;
    }
  } catch (err) {
    console.error('[inventoryService] deleteSku exception:', err);
    throw err;
  }
}

// ─── Stock Movements ──────────────────────────────────────────────

/**
 * Record a stock IN or OUT movement and auto-update the SKU's current stock.
 * Returns the logged movement for confirmation.
 */
export async function recordStockMovement(
  userId: string,
  skuId: string,
  type: MovementType,
  quantity: number,
  reason: string,
  price?: number
): Promise<StockLog> {
  const logId = 'LOG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  try {
    // 1. Insert log entry
    const { error: logError } = await supabase
      .from('stock_logs')
      .insert({
        id: logId,
        user_id: userId,
        sku_id: skuId,
        type,
        quantity,
        reason,
        price: price || null,
      });

    if (logError) {
      console.error('[inventoryService] recordStockMovement insert failed:', logError.message);
      throw logError;
    }

    // 2. Fetch current SKU state
    const sku = await fetchSkuById(skuId);
    if (!sku) {
      throw new Error(`SKU ${skuId} not found`);
    }

    // 3. Calculate new totals
    const newTotalIn = type === 'IN' ? sku.totalIn + quantity : sku.totalIn;
    const newTotalOut = type === 'OUT' ? sku.totalOut + quantity : sku.totalOut;
    const newCurrentStock = sku.openingStock + newTotalIn - newTotalOut;

    // 4. Determine stock status
    let status: SKU['status'] = 'OPTIMAL';
    const threshold = sku.minThreshold;
    if (newCurrentStock <= 0) {
      status = 'CRITICAL';
    } else if (newCurrentStock < threshold) {
      status = 'LOW';
    } else if (newCurrentStock > threshold * 5) {
      status = 'EXCESS';
    }

    // 5. Update SKU with new totals and status
    const { error: updateError } = await supabase
      .from('user_inventory')
      .update({
        total_in: newTotalIn,
        total_out: newTotalOut,
        current_stock: newCurrentStock,
        status,
        last_updated: new Date().toISOString(),
      })
      .eq('id', skuId);

    if (updateError) {
      console.error('[inventoryService] recordStockMovement update failed:', updateError.message);
      throw updateError;
    }

    // 6. Return the log entry
    return {
      id: logId,
      skuId,
      type,
      quantity,
      price,
      reason,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[inventoryService] recordStockMovement exception:', err);
    throw err;
  }
}

/**
 * Fetch movement history for a specific SKU
 */
export async function fetchSkuHistory(skuId: string, limit: number = 50): Promise<StockLog[]> {
  try {
    const { data, error } = await supabase
      .from('stock_logs')
      .select('*')
      .eq('sku_id', skuId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[inventoryService] fetchSkuHistory failed:', error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      skuId: row.sku_id,
      type: row.type,
      quantity: row.quantity,
      price: row.price,
      reason: row.reason,
      timestamp: row.timestamp,
    }));
  } catch (err) {
    console.error('[inventoryService] fetchSkuHistory exception:', err);
    return [];
  }
}

/**
 * Fetch movement history for a user across all SKUs
 */
export async function fetchUserMovementHistory(userId: string, limit: number = 100): Promise<StockLog[]> {
  try {
    const { data, error } = await supabase
      .from('stock_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[inventoryService] fetchUserMovementHistory failed:', error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      skuId: row.sku_id,
      type: row.type,
      quantity: row.quantity,
      price: row.price,
      reason: row.reason,
      timestamp: row.timestamp,
    }));
  } catch (err) {
    console.error('[inventoryService] fetchUserMovementHistory exception:', err);
    return [];
  }
}

// ─── Inventory Aggregations ──────────────────────────────────────

/**
 * Get inventory health score (0-100)
 * Based on: stock levels, overstocks, critical items
 */
export function calculateHealthScore(inventory: SKU[]): number {
  if (!inventory.length) return 50;

  const optimal = inventory.filter(s => s.status === 'OPTIMAL').length;
  const low = inventory.filter(s => s.status === 'LOW').length;
  const critical = inventory.filter(s => s.status === 'CRITICAL').length;
  const excess = inventory.filter(s => s.status === 'EXCESS').length;

  const total = inventory.length;
  const score = Math.round(
    (optimal / total) * 100 - (low / total) * 20 - (critical / total) * 40 - (excess / total) * 15
  );

  return Math.max(0, Math.min(100, score));
}

/**
 * Get total inventory value (current stock * price)
 */
export function calculateTotalInventoryValue(inventory: SKU[]): number {
  return inventory.reduce((sum, sku) => sum + (sku.currentStock * sku.price), 0);
}

/**
 * Count items by status
 */
export function countByStatus(inventory: SKU[]): Record<string, number> {
  return {
    OPTIMAL: inventory.filter(s => s.status === 'OPTIMAL').length,
    LOW: inventory.filter(s => s.status === 'LOW').length,
    CRITICAL: inventory.filter(s => s.status === 'CRITICAL').length,
    EXCESS: inventory.filter(s => s.status === 'EXCESS').length,
  };
}

// ─── Real-time subscription ──────────────────────────────────────

/**
 * Subscribe to real-time inventory changes for a user.
 * Returns an unsubscribe function to call when component unmounts.
 */
export function subscribeToInventory(
  userId: string,
  onUpdate: (inventory: SKU[]) => void
): () => void {
  const channel = supabase
    .channel(`inventory-${userId}-realtime`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_inventory',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[inventoryService] Real-time update:', payload.eventType);
        const fresh = await fetchInventory(userId);
        onUpdate(fresh);
      }
    )
    .subscribe((status) => {
      console.log('[inventoryService] Subscription status:', status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to stock log changes (movements)
 */
export function subscribeToStockLogs(
  userId: string,
  onUpdate: (logs: StockLog[]) => void
): () => void {
  const channel = supabase
    .channel(`stock-logs-${userId}-realtime`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'stock_logs',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[inventoryService] New movement logged:', payload.new);
        const fresh = await fetchUserMovementHistory(userId);
        onUpdate(fresh);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Convert database row to SKU object
 */
function rowToSku(row: any): SKU {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    price: row.price || 0,
    openingStock: row.opening_stock || 0,
    totalIn: row.total_in || 0,
    totalOut: row.total_out || 0,
    currentStock: row.current_stock || 0,
    minThreshold: row.min_threshold || 5,
    lastUpdated: row.last_updated,
    status: row.status || 'OPTIMAL',
    expiryDate: row.expiry_date,
  };
}

/**
 * Generate report of low/critical stock items
 */
export function generateLowStockReport(inventory: SKU[]): SKU[] {
  return inventory.filter(sku => sku.status === 'LOW' || sku.status === 'CRITICAL');
}

/**
 * Generate report of overstock items
 */
export function generateOverstockReport(inventory: SKU[]): SKU[] {
  return inventory.filter(sku => sku.status === 'EXCESS');
}
