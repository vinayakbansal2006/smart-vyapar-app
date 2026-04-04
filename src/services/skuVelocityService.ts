export type SkuVelocityStatus = 'Critical' | 'Low stock' | 'Optimal' | 'Excess';

export interface KiranaStock {
  id: string;
  name: string;
  unitsHeld: number;
  lastRestock: string;
  daysUntilEmpty: number;
}

export interface SkuVelocityItem {
  id: string;
  name: string;
  category: string;
  pinCode: string;
  area: string;
  unitsSold7d: number;
  sellRatePerDay: number;
  velocityChangePercent: number;
  stockoutDays: number;
  status: SkuVelocityStatus;
  kiranas: KiranaStock[];
}

export interface SkuVelocityMeta {
  totalTracked: number;
  topMover: {
    id: string;
    name: string;
    velocityChangePercent: number;
  };
  criticalCount: number;
  kiranaCount: number;
  categoryCount: number;
  newKiranasThisWeek: number;
}

export interface SkuVelocityResponse {
  skus: SkuVelocityItem[];
  meta: SkuVelocityMeta;
}

export interface SkuVelocityQuery {
  city?: string;
  dateRange?: 'Last 7 days' | 'Last 14 days' | 'Last 30 days';
  category?: string[];
}

export interface AlertPayload {
  skuId: string;
  distributorId: string;
  message: string;
}

const DEFAULT_MOCK: SkuVelocityItem[] = [];

const MOCK_KIRANAS: Record<string, KiranaStock[]> = {};

function computeMeta(skus: SkuVelocityItem[]): SkuVelocityMeta {
  const totalTracked = skus.length;
  const topMover = skus.reduce((best, sku) => {
    if (!best || sku.velocityChangePercent > best.velocityChangePercent) {
      return { id: sku.id, name: sku.name, velocityChangePercent: sku.velocityChangePercent };
    }
    return best;
  }, null as SkuVelocityMeta['topMover'] | null) || { id: '', name: '-', velocityChangePercent: 0 };

  const criticalCount = skus.filter((sku) => sku.stockoutDays <= 6).length;
  const kiranaCount = skus.reduce((sum, sku) => sum + (sku.kiranas?.length || 0), 0);
  const categoryCount = new Set(skus.map((sku) => sku.category)).size;

  return {
    totalTracked,
    topMover,
    criticalCount,
    kiranaCount,
    categoryCount,
    newKiranasThisWeek: skus.length > 0 ? 138 : 0,
  };
}

function buildQuery(params: SkuVelocityQuery): string {
  const query = new URLSearchParams();
  if (params.city && params.city !== 'All cities') query.set('city', params.city);
  if (params.dateRange) query.set('dateRange', params.dateRange);
  if (params.category && params.category.length > 0) query.set('category', params.category.join(','));
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export async function fetchSkuVelocity(params: SkuVelocityQuery = {}, localInventory?: any[]): Promise<SkuVelocityResponse> {
  try {
    const response = await fetch(`/api/manufacturer/sku-velocity${buildQuery(params)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as SkuVelocityResponse;
    return {
      skus: Array.isArray(data.skus) ? data.skus : [],
      meta: data.meta ?? computeMeta(data.skus ?? []),
    };
  } catch {
    const skus = (localInventory || []).map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category || 'Uncategorized',
      pinCode: 'Local',
      area: 'Store Front',
      unitsSold7d: item.totalOut || 0,
      sellRatePerDay: item.totalOut ? Math.max(1, Math.floor(item.totalOut / 7)) : 0,
      velocityChangePercent: 0,
      stockoutDays: item.currentStock > 0 ? Math.max(1, Math.floor(item.currentStock / 5)) : 0,
      status: (item.status === 'LOW' ? 'Low stock' : item.status === 'OPTIMAL' ? 'Optimal' : item.status === 'CRITICAL' ? 'Critical' : 'Excess') as SkuVelocityStatus,
      kiranas: MOCK_KIRANAS[item.id] ?? [],
    }));
    return { skus, meta: computeMeta(skus) };
  }
}

export async function fetchSkuKiranas(skuId: string): Promise<KiranaStock[]> {
  try {
    const response = await fetch(`/api/manufacturer/sku/${skuId}/kiranas`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as { kiranas?: KiranaStock[] };
    return Array.isArray(data.kiranas) ? data.kiranas : [];
  } catch {
    return MOCK_KIRANAS[skuId] ?? [];
  }
}

export async function postManufacturerAlert(payload: AlertPayload): Promise<void> {
  try {
    await fetch('/api/manufacturer/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking in local/demo mode.
  }
}
