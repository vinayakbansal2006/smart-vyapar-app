import { create } from 'zustand';
import { fetchSkuKiranas, fetchSkuVelocity, type KiranaStock, type SkuVelocityItem, type SkuVelocityMeta, type SkuVelocityStatus } from '../services/skuVelocityService';

export type SkuSort = 'Sell velocity' | 'Stockout risk' | 'Units sold' | 'Pin code';
export type SkuDateRange = 'Last 7 days' | 'Last 14 days' | 'Last 30 days';
export type SkuStatusFilter = 'All' | SkuVelocityStatus;

export interface SkuFilters {
  city: 'All cities' | 'Pune' | 'Mumbai' | 'Nashik';
  dateRange: SkuDateRange;
  category: string[];
  status: SkuStatusFilter;
  search: string;
  sort: SkuSort;
}

interface SkuStoreState {
  skus: SkuVelocityItem[];
  meta: SkuVelocityMeta;
  filters: SkuFilters;
  loading: boolean;
  lastUpdated: number | null;
  expandedSkuIds: string[];
  loadSkus: () => Promise<void>;
  loadKiranas: (skuId: string) => Promise<void>;
  setSearch: (search: string) => void;
  setStatus: (status: SkuStatusFilter) => void;
  setSort: (sort: SkuSort) => void;
  setCity: (city: SkuFilters['city']) => void;
  setDateRange: (dateRange: SkuDateRange) => void;
  toggleCategory: (category: string) => void;
  clearCategoryFilters: () => void;
  toggleExpanded: (skuId: string) => void;
  closeExpanded: (skuId: string) => void;
}

const DEFAULT_META: SkuVelocityMeta = {
  totalTracked: 0,
  topMover: { id: '', name: '-', velocityChangePercent: 0 },
  criticalCount: 0,
  kiranaCount: 0,
  categoryCount: 0,
  newKiranasThisWeek: 0,
};

export const useSkuStore = create<SkuStoreState>((set, get) => ({
  skus: [],
  meta: DEFAULT_META,
  filters: {
    city: 'All cities',
    dateRange: 'Last 7 days',
    category: [],
    status: 'All',
    search: '',
    sort: 'Sell velocity',
  },
  loading: false,
  lastUpdated: null,
  expandedSkuIds: [],

  loadSkus: async () => {
    const { filters } = get();
    set({ loading: true });
    const response = await fetchSkuVelocity({
      city: filters.city,
      dateRange: filters.dateRange,
      category: filters.category,
    });
    set({
      skus: response.skus,
      meta: response.meta,
      loading: false,
      lastUpdated: Date.now(),
    });
  },

  loadKiranas: async (skuId: string) => {
    const hasKiranas = get().skus.some((sku) => sku.id === skuId && sku.kiranas.length > 0);
    if (hasKiranas) return;

    const kiranas = await fetchSkuKiranas(skuId);
    set((state) => ({
      skus: state.skus.map((sku) => (
        sku.id === skuId ? { ...sku, kiranas } : sku
      )),
      lastUpdated: Date.now(),
    }));
  },

  setSearch: (search) => set((state) => ({ filters: { ...state.filters, search } })),
  setStatus: (status) => set((state) => ({ filters: { ...state.filters, status } })),
  setSort: (sort) => set((state) => ({ filters: { ...state.filters, sort } })),
  setCity: (city) => set((state) => ({ filters: { ...state.filters, city } })),
  setDateRange: (dateRange) => set((state) => ({ filters: { ...state.filters, dateRange } })),

  toggleCategory: (category) => set((state) => {
    const exists = state.filters.category.includes(category);
    const categoryFilters = exists
      ? state.filters.category.filter((c) => c !== category)
      : [...state.filters.category, category];
    return { filters: { ...state.filters, category: categoryFilters } };
  }),

  clearCategoryFilters: () => set((state) => ({ filters: { ...state.filters, category: [] } })),

  toggleExpanded: (skuId) => set((state) => {
    const exists = state.expandedSkuIds.includes(skuId);
    return {
      expandedSkuIds: exists
        ? state.expandedSkuIds.filter((id) => id !== skuId)
        : [...state.expandedSkuIds, skuId],
    };
  }),

  closeExpanded: (skuId) => set((state) => ({
    expandedSkuIds: state.expandedSkuIds.filter((id) => id !== skuId),
  })),
}));

export function getDaysRiskColor(days: number): string {
  if (days <= 7) return '#F85149';
  if (days <= 14) return '#D29922';
  return '#3FB950';
}

export function filterAndSortSkus(skus: SkuVelocityItem[], filters: SkuFilters): SkuVelocityItem[] {
  const query = filters.search.trim().toLowerCase();
  const filtered = skus.filter((sku) => {
    const matchesSearch = !query
      || sku.name.toLowerCase().includes(query)
      || sku.pinCode.toLowerCase().includes(query);
    const matchesStatus = filters.status === 'All' || sku.status === filters.status;
    const matchesCategory = filters.category.length === 0 || filters.category.includes(sku.category);
    const matchesCity = filters.city === 'All cities' || cityForPin(sku.pinCode) === filters.city;
    return matchesSearch && matchesStatus && matchesCategory && matchesCity;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === 'Sell velocity') return b.sellRatePerDay - a.sellRatePerDay;
    if (filters.sort === 'Stockout risk') return a.stockoutDays - b.stockoutDays;
    if (filters.sort === 'Units sold') return b.unitsSold7d - a.unitsSold7d;
    return a.pinCode.localeCompare(b.pinCode);
  });
}

function cityForPin(pinCode: string): SkuFilters['city'] {
  if (pinCode.startsWith('411')) return 'Pune';
  if (pinCode.startsWith('400')) return 'Mumbai';
  if (pinCode.startsWith('422')) return 'Nashik';
  return 'All cities';
}

export function getActionLabel(sku: SkuVelocityItem): string {
  if (sku.stockoutDays <= 6) return 'Alert distributor';
  if (sku.velocityChangePercent < -5) return 'Investigate drop';
  if (sku.stockoutDays <= 14) return 'Create campaign';
  return 'View kiranas';
}

export function getCategoryOptions(skus: SkuVelocityItem[]): string[] {
  return Array.from(new Set(skus.map((sku) => sku.category))).sort((a, b) => a.localeCompare(b));
}

export function formatRelativeMinutes(lastUpdated: number | null): string {
  if (!lastUpdated) return 'Not refreshed yet';
  const mins = Math.max(0, Math.floor((Date.now() - lastUpdated) / 60000));
  return `Refreshed ${mins} min ago`;
}

export function createAlertPayload(action: string, sku: SkuVelocityItem): { distributorId: string; message: string } {
  if (action === 'Alert distributor') {
    return {
      distributorId: 'dist-priority-001',
      message: `Critical stockout risk for ${sku.name}. Only ${sku.stockoutDays} days left.`,
    };
  }
  if (action === 'Investigate drop') {
    return {
      distributorId: 'dist-insights-004',
      message: `Velocity dropped ${Math.abs(sku.velocityChangePercent)}% for ${sku.name}. Please review.` ,
    };
  }
  if (action === 'Create campaign') {
    return {
      distributorId: 'dist-campaign-007',
      message: `Demand campaign requested for ${sku.name} in ${sku.area} (${sku.pinCode}).`,
    };
  }
  return {
    distributorId: 'dist-ops-010',
    message: `Viewing kirana distribution for ${sku.name}.`,
  };
}

export type { KiranaStock };
