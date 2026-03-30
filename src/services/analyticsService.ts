/**
 * Analytics Service
 * ─────────────────
 * Provides business intelligence & KPI calculations.
 * Aggregates data from inventory, payments, and expenses for dashboard insights.
 */

import { supabase } from '../backend/supabase';
import type { SKU, Expense, Payment, StockLog } from '../types';

// ─── KPI Definitions ─────────────────────────────────────────────

export interface DashboardKPIs {
  totalItems: number;
  criticalItems: number;
  lowStockItems: number;
  inventoryValue: number;
  inventoryHealthScore: number;
  totalExpenses: number;
  totalReceived: number;
  totalPaid: number;
  netCashFlow: number;
  pendingPayments: number;
  expiringItems: number;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  averageOrderValue: number;
  topSellingItem: string | null;
  topSellingCategory: string | null;
}

export interface InventoryAnalysis {
  overstock: SKU[];
  understock: SKU[];
  slowMoving: SKU[];
  fastMoving: SKU[];
  expiringItems: SKU[];
  turnoverRatio: number;
}

// ─── Raw Data Aggregation ───────────────────────────────────────

/**
 * Calculate comprehensive dashboard KPIs
 */
export function calculateDashboardKPIs(
  inventory: SKU[],
  expenses: Expense[],
  payments: Payment[]
): DashboardKPIs {
  // Inventory metrics
  const totalItems = inventory.length;
  const criticalItems = inventory.filter(s => s.status === 'CRITICAL').length;
  const lowStockItems = inventory.filter(s => s.status === 'LOW').length;
  const inventoryValue = inventory.reduce((sum, s) => sum + s.currentStock * s.price, 0);
  const inventoryHealthScore = calculateHealthScore(inventory);

  // Expense metrics
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Payment metrics
  const totalReceived = payments
    .filter(p => p.type === 'RECEIVED' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments
    .filter(p => p.type === 'PAID' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const netCashFlow = totalReceived - totalPaid;
  const pendingPayments = payments.filter(p => p.status === 'PENDING').length;

  // Expiring items (within 30 days)
  const today = new Date();
  const thirtyDaysAhead = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringItems = inventory.filter(sku => {
    if (!sku.expiryDate) return false;
    const expiryDate = new Date(sku.expiryDate);
    return expiryDate >= today && expiryDate <= thirtyDaysAhead;
  }).length;

  return {
    totalItems,
    criticalItems,
    lowStockItems,
    inventoryValue,
    inventoryHealthScore,
    totalExpenses,
    totalReceived,
    totalPaid,
    netCashFlow,
    pendingPayments,
    expiringItems,
  };
}

/**
 * Calculate sales metrics from stock movements
 */
export function calculateSalesMetrics(
  inventory: SKU[],
  movements: StockLog[],
  expenses: Expense[]
): SalesMetrics {
  // Calculate revenue from outgoing movements with price
  const totalRevenue = movements
    .filter(m => m.type === 'OUT' && m.price)
    .reduce((sum, m) => sum + ((m.price || 0) * m.quantity), 0);

  // Calculate cost of goods sold
  const totalCost = expenses.reduce((sum, e) => sum + e.amount, 0);

  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Find top selling items (most frequently moved out)
  const itemFrequency: Record<string, { count: number; quantity: number }> = {};
  movements.filter(m => m.type === 'OUT').forEach(m => {
    if (!itemFrequency[m.skuId]) {
      itemFrequency[m.skuId] = { count: 0, quantity: 0 };
    }
    itemFrequency[m.skuId].count += 1;
    itemFrequency[m.skuId].quantity += m.quantity;
  });

  let topSellingItem: string | null = null;
  let maxQuantity = 0;
  for (const [skuId, data] of Object.entries(itemFrequency)) {
    if (data.quantity > maxQuantity) {
      maxQuantity = data.quantity;
      const sku = inventory.find(s => s.id === skuId);
      topSellingItem = sku ? sku.name : skuId;
    }
  }

  // Top selling category
  let topSellingCategory: string | null = null;
  const categoryRevenue: Record<string, number> = {};
  movements.filter(m => m.type === 'OUT' && m.price).forEach(m => {
    const sku = inventory.find(s => s.id === m.skuId);
    if (sku) {
      const revenue = (m.price || 0) * m.quantity;
      categoryRevenue[sku.category] = (categoryRevenue[sku.category] || 0) + revenue;
    }
  });
  topSellingCategory = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Average order value
  const numberOfTransactions = movements.filter(m => m.type === 'OUT').length;
  const averageOrderValue = numberOfTransactions > 0 ? totalRevenue / numberOfTransactions : 0;

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    profitMargin,
    averageOrderValue,
    topSellingItem,
    topSellingCategory,
  };
}

/**
 * Analyze inventory patterns
 */
export function analyzeInventory(
  inventory: SKU[],
  movements: StockLog[]
): InventoryAnalysis {
  // Classify items
  const overstock = inventory.filter(s => s.status === 'EXCESS');
  const understock = inventory.filter(s => s.status === 'LOW' || s.status === 'CRITICAL');

  // Slow moving: high stock but low recent outflows
  const slowMoving = inventory.filter(s => {
    const outflows = movements
      .filter(m => m.skuId === s.id && m.type === 'OUT')
      .reduce((sum, m) => sum + m.quantity, 0);
    return s.currentStock > s.minThreshold * 2 && outflows < 5;
  });

  // Fast moving: low stock but high outflows
  const fastMoving = inventory.filter(s => {
    const outflows = movements
      .filter(m => m.skuId === s.id && m.type === 'OUT')
      .reduce((sum, m) => sum + m.quantity, 0);
    return s.currentStock < s.minThreshold * 2 && outflows >= 10;
  });

  // Expiring items (within 30 days)
  const today = new Date();
  const thirtyDaysAhead = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringItems = inventory.filter(sku => {
    if (!sku.expiryDate) return false;
    const expiryDate = new Date(sku.expiryDate);
    return expiryDate >= today && expiryDate <= thirtyDaysAhead;
  });

  // Inventory turnover ratio (COGS / Avg inventory value)
  const totalOutflowValue = movements
    .filter(m => m.type === 'OUT')
    .reduce((sum, m) => {
      const sku = inventory.find(s => s.id === m.skuId);
      return sum + (sku ? sku.price * m.quantity : 0);
    }, 0);

  const avgInventoryValue = inventory.reduce((sum, s) => sum + s.price * s.currentStock, 0) / Math.max(inventory.length, 1);
  const turnoverRatio = avgInventoryValue > 0 ? totalOutflowValue / avgInventoryValue : 0;

  return {
    overstock,
    understock,
    slowMoving,
    fastMoving,
    expiringItems,
    turnoverRatio,
  };
}

// ─── Database Queries ───────────────────────────────────────────

/**
 * Fetch analytics summary for dashboard
 */
export async function fetchAnalyticsSummary(userId: string) {
  try {
    // Fetch all data in parallel
    const [inventory, movements, expenses, payments] = await Promise.all([
      supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .then(res => res.data || []),
      supabase
        .from('stock_logs')
        .select('*')
        .eq('user_id', userId)
        .then(res => res.data || []),
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .then(res => res.data || []),
      supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .then(res => res.data || []),
    ]);

    return {
      inventory,
      movements,
      expenses,
      payments,
    };
  } catch (err) {
    console.error('[analyticsService] fetchAnalyticsSummary exception:', err);
    return {
      inventory: [],
      movements: [],
      expenses: [],
      payments: [],
    };
  }
}

// ─── Trend Analysis ─────────────────────────────────────────────

/**
 * Get sales trend for the last N days
 */
export async function getSalesTrendLastNDays(
  userId: string,
  days: number = 7
): Promise<Array<{ date: string; total: number }>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('stock_logs')
      .select('timestamp, quantity, sku_id(price)')
      .eq('user_id', userId)
      .eq('type', 'OUT')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('[analyticsService] getSalesTrendLastNDays failed:', error.message);
      return [];
    }

    const trendMap: Record<string, number> = {};
    (data ?? []).forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      trendMap[date] = (trendMap[date] || 0) + (log.quantity * (log.sku_id?.price || 0));
    });

    return Object.entries(trendMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error('[analyticsService] getSalesTrendLastNDays exception:', err);
    return [];
  }
}

// ─── Health Score Calculation ───────────────────────────────────

/**
 * Calculate inventory health score (0-100)
 */
export function calculateHealthScore(inventory: SKU[]): number {
  if (!inventory.length) return 50;

  const optimal = inventory.filter(s => s.status === 'OPTIMAL').length;
  const low = inventory.filter(s => s.status === 'LOW').length;
  const critical = inventory.filter(s => s.status === 'CRITICAL').length;
  const excess = inventory.filter(s => s.status === 'EXCESS').length;

  const total = inventory.length;
  const score = Math.round(
    (optimal / total) * 100 -
      (low / total) * 20 -
      (critical / total) * 40 -
      (excess / total) * 15
  );

  return Math.max(0, Math.min(100, score));
}

/**
 * Get health score color for UI
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#f59e0b'; // amber
  if (score >= 40) return '#ef4444'; // red
  return '#7c3aed'; // purple (critical)
}
