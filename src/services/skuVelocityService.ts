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

const DEFAULT_MOCK: SkuVelocityItem[] = [
  {
    id: 'sku-101',
    name: 'Sunrise Mustard Oil 1L',
    category: 'Edible Oils',
    pinCode: '411014',
    area: 'Viman Nagar',
    unitsSold7d: 843,
    sellRatePerDay: 120,
    velocityChangePercent: 14,
    stockoutDays: 6,
    status: 'Critical',
    kiranas: [],
  },
  {
    id: 'sku-102',
    name: 'Classic Wheat Atta 10kg',
    category: 'Staples',
    pinCode: '400076',
    area: 'Powai',
    unitsSold7d: 611,
    sellRatePerDay: 87,
    velocityChangePercent: -9,
    stockoutDays: 12,
    status: 'Low stock',
    kiranas: [],
  },
  {
    id: 'sku-103',
    name: 'Active Detergent 2kg',
    category: 'Home Care',
    pinCode: '422003',
    area: 'Gangapur',
    unitsSold7d: 430,
    sellRatePerDay: 61,
    velocityChangePercent: 5,
    stockoutDays: 18,
    status: 'Optimal',
    kiranas: [],
  },
  {
    id: 'sku-104',
    name: 'Fresh Cola 750ml',
    category: 'Beverages',
    pinCode: '411001',
    area: 'Shivaji Nagar',
    unitsSold7d: 120,
    sellRatePerDay: 17,
    velocityChangePercent: -3,
    stockoutDays: 27,
    status: 'Excess',
    kiranas: [],
  },
];

const MOCK_KIRANAS: Record<string, KiranaStock[]> = {
  'sku-101': [
    { id: 'k-1', name: 'Om Super Kirana', unitsHeld: 63, lastRestock: '2026-03-24', daysUntilEmpty: 2 },
    { id: 'k-2', name: 'Mahalaxmi Stores', unitsHeld: 88, lastRestock: '2026-03-23', daysUntilEmpty: 4 },
  ],
  'sku-102': [
    { id: 'k-3', name: 'Shree Ganesh Mart', unitsHeld: 112, lastRestock: '2026-03-20', daysUntilEmpty: 8 },
  ],
  'sku-103': [
    { id: 'k-4', name: 'City Basket', unitsHeld: 145, lastRestock: '2026-03-18', daysUntilEmpty: 16 },
    { id: 'k-5', name: 'A1 General Store', unitsHeld: 81, lastRestock: '2026-03-22', daysUntilEmpty: 12 },
  ],
  'sku-104': [
    { id: 'k-6', name: 'Raj Provision', unitsHeld: 201, lastRestock: '2026-03-10', daysUntilEmpty: 29 },
  ],
};

function computeMeta(skus: SkuVelocityItem[]): SkuVelocityMeta {
  const totalTracked = skus.length;
  const topMover = skus.reduce((best, sku) => {
    if (!best || sku.velocityChangePercent > best.velocityChangePercent) {
      return { id: sku.id, name: sku.name, velocityChangePercent: sku.velocityChangePercent };
    }
    return best;
  }, null as SkuVelocityMeta['topMover'] | null) || { id: '', name: '-', velocityChangePercent: 0 };

  const criticalCount = skus.filter((sku) => sku.stockoutDays <= 6).length;
  const kiranaCount = skus.reduce((sum, sku) => sum + sku.kiranas.length, 0) || 12458;
  const categoryCount = new Set(skus.map((sku) => sku.category)).size;

  return {
    totalTracked,
    topMover,
    criticalCount,
    kiranaCount,
    categoryCount,
    newKiranasThisWeek: 138,
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

export async function fetchSkuVelocity(params: SkuVelocityQuery = {}): Promise<SkuVelocityResponse> {
  try {
    const response = await fetch(`/api/manufacturer/sku-velocity${buildQuery(params)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as SkuVelocityResponse;
    return {
      skus: Array.isArray(data.skus) ? data.skus : [],
      meta: data.meta ?? computeMeta(data.skus ?? []),
    };
  } catch {
    const skus = DEFAULT_MOCK.map((sku) => ({
      ...sku,
      kiranas: MOCK_KIRANAS[sku.id] ?? [],
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
