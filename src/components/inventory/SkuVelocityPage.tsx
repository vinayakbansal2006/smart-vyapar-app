/**
 * =========================================================================
 * SKU Velocity & Inventory Health Page (SkuVelocityPage.tsx)
 * -------------------------------------------------------------------------
 * Connects directly to the skuStore state to list products. Calculates 
 * velocity of item sales, estimates stockout risk timing, and creates
 * vendor/manufacturer alerts when an item runs out unexpectedly soon.
 * Offers filtering, sorting, and manual status overrides.
 * =========================================================================
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, Search, Share2, Check, Plus } from 'lucide-react';
import { postManufacturerAlert, type SkuVelocityItem } from '../../services/skuVelocityService';
import {
  createAlertPayload,
  filterAndSortSkus,
  formatRelativeMinutes,
  getActionLabel,
  getCategoryOptions,
  getDaysRiskColor,
  useSkuStore,
  type SkuSort,
  type SkuStatusFilter,
} from '../../store/skuStore';

interface SkuVelocityPageProps {
  onAddSku: () => void;
  inventory?: any[];
}

const COLORS = {
  page: 'var(--color-bg-app)',
  card: 'var(--color-surface)',
  input: 'var(--color-surface-2)',
  accent: '#7C5CFC',
  onAccent: 'var(--color-on-accent)',
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textMuted: 'var(--color-text-muted)',
  success: '#3FB950',
  warning: '#D29922',
  danger: '#F85149',
  border: 'var(--color-border)',
};

const STATUS_OPTIONS: SkuStatusFilter[] = ['All', 'Critical', 'Low stock', 'Optimal', 'Excess'];
const SORT_OPTIONS: SkuSort[] = ['Sell velocity', 'Stockout risk', 'Units sold', 'Pin code'];
const CITY_OPTIONS = ['All cities', 'Pune', 'Mumbai', 'Nashik'] as const;
const DATE_OPTIONS = ['Last 7 days', 'Last 14 days', 'Last 30 days'] as const;

const statusBadgeMap = {
  Critical: { bg: 'var(--status-critical-bg)', text: 'var(--status-critical-text)', border: 'var(--status-critical-border)' },
  'Low stock': { bg: 'var(--status-low-bg)', text: 'var(--status-low-text)', border: 'var(--status-low-border)' },
  Optimal: { bg: 'var(--status-optimal-bg)', text: 'var(--status-optimal-text)', border: 'var(--status-optimal-border)' },
  Excess: { bg: 'var(--status-excess-bg)', text: 'var(--status-excess-text)', border: 'var(--status-excess-border)' },
} as const;

function formatPercent(value: number): string {
  const abs = Math.abs(value);
  return `${value >= 0 ? '+' : '-'}${abs}% vs last week`;
}

function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

function rowActionDescription(action: string, sku: SkuVelocityItem): string {
  if (action === 'Alert distributor') return `Push urgent alert for ${sku.name} to priority distributor.`;
  if (action === 'Investigate drop') return `Open root-cause checklist for ${sku.name} velocity decline.`;
  if (action === 'Create campaign') return `Draft a local campaign for ${sku.name} in ${sku.area}.`;
  return `See kiranas and allocation detail for ${sku.name}.`;
}

const SkuVelocityPage: React.FC<SkuVelocityPageProps> = ({ onAddSku, inventory }) => {
  const {
    skus,
    meta,
    filters,
    loading,
    lastUpdated,
    expandedSkuIds,
    loadSkus,
    loadKiranas,
    setSearch,
    setStatus,
    setSort,
    setCity,
    setDateRange,
    toggleCategory,
    clearCategoryFilters,
    toggleExpanded,
  } = useSkuStore();

  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [actionSheet, setActionSheet] = useState<{ open: boolean; sku: SkuVelocityItem | null; action: string }>({
    open: false,
    sku: null,
    action: '',
  });

  useEffect(() => {
    loadSkus(inventory);
  }, [loadSkus, inventory]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadSkus(inventory);
    }, 4 * 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadSkus, inventory]);

  const categories = useMemo(() => getCategoryOptions(skus), [skus]);
  const visibleSkus = useMemo(() => filterAndSortSkus(skus, filters), [skus, filters]);

  const openRow = async (skuId: string) => {
    toggleExpanded(skuId);
    const alreadyExpanded = expandedSkuIds.includes(skuId);
    if (!alreadyExpanded) {
      await loadKiranas(skuId);
    }
  };

  const onAction = (sku: SkuVelocityItem) => {
    const action = getActionLabel(sku);
    setActionSheet({ open: true, sku, action });
  };

  const confirmAction = async () => {
    if (!actionSheet.sku) return;
    const payload = createAlertPayload(actionSheet.action, actionSheet.sku);
    await postManufacturerAlert({
      skuId: actionSheet.sku.id,
      distributorId: payload.distributorId,
      message: payload.message,
    });
    setActionSheet({ open: false, sku: null, action: '' });
  };

  const topCards = [
    {
      label: 'SKUs tracked',
      value: meta.totalTracked.toLocaleString('en-IN'),
      sub: `across ${meta.categoryCount || 0} categories`,
      subColor: COLORS.success,
      valueColor: COLORS.textPrimary,
    },
    {
      label: 'Top mover this week',
      value: meta.topMover.name || '-',
      sub: `${meta.topMover.velocityChangePercent >= 0 ? '+' : ''}${meta.topMover.velocityChangePercent}% vs last week`,
      subColor: COLORS.success,
      valueColor: COLORS.textPrimary,
    },
    {
      label: 'Stockout risk',
      value: meta.criticalCount.toLocaleString('en-IN'),
      sub: 'within next 6 days',
      subColor: COLORS.textSecondary,
      valueColor: COLORS.danger,
    },
    {
      label: 'Kiranas reporting',
      value: meta.kiranaCount.toLocaleString('en-IN'),
      sub: `+${meta.newKiranasThisWeek} this week`,
      subColor: COLORS.success,
      valueColor: COLORS.textPrimary,
    },
  ];

  if (!loading && skus.length === 0) {
    return (
      <div style={{
        minHeight: '100%',
        background: COLORS.page,
        color: COLORS.textPrimary,
        borderRadius: 16,
        border: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ width: 92, height: 92, borderRadius: 20, background: COLORS.input, border: `1px solid ${COLORS.border}` }} />
        <p style={{ fontSize: 16, fontWeight: 600, marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
          No SKUs tracked yet. Add your first product to start seeing velocity data.
        </p>
        <button
          onClick={onAddSku}
          style={{
            marginTop: 12,
            height: 40,
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.accent,
            color: COLORS.onAccent,
            padding: '0 16px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Add SKU
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: COLORS.page, color: COLORS.textPrimary, borderRadius: 16, border: `1px solid ${COLORS.border}`, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>SKU Velocity</p>
          <p style={{ margin: '2px 0 0 0', fontSize: 11, color: COLORS.textSecondary }}>{formatRelativeMinutes(lastUpdated)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setFilterSheetOpen(true)} style={iconButtonStyle}><Filter size={16} color={COLORS.textPrimary} /></button>
          <button onClick={() => setShareSheetOpen(true)} style={iconButtonStyle}><Share2 size={16} color={COLORS.textPrimary} /></button>
          {skus.length > 0 && (
            <button onClick={onAddSku} style={{...iconButtonStyle, background: COLORS.accent, borderColor: COLORS.accent}}>
              <Plus size={16} color={COLORS.onAccent} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 12px 0 12px' }}>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {topCards.map((card) => (
            <div key={card.label} style={{ width: 140, height: 80, flexShrink: 0, borderRadius: 12, background: COLORS.card, border: `1px solid ${COLORS.border}`, padding: 12 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: COLORS.textSecondary }}>{card.label}</p>
              <p style={{ margin: '6px 0 3px 0', fontSize: 16, fontWeight: 600, color: card.valueColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {card.value}
              </p>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: card.subColor }}>{card.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, marginBottom: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color={COLORS.textSecondary} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={filters.search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search SKU or pin code..."
              style={{
                width: '100%',
                height: 40,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.input,
                color: COLORS.textPrimary,
                paddingLeft: 34,
                paddingRight: 10,
                outline: 'none',
                fontSize: 13,
                fontWeight: 400,
              }}
            />
          </div>

          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', overflowX: 'auto', gap: 8, flex: 1 }}>
              {STATUS_OPTIONS.map((status) => {
                const active = filters.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => setStatus(status)}
                    style={{
                      height: 32,
                      borderRadius: 8,
                      border: `1px solid ${COLORS.border}`,
                      background: active ? COLORS.accent : COLORS.input,
                      color: active ? COLORS.textPrimary : COLORS.textSecondary,
                      padding: '0 12px',
                      fontSize: 12,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setSortSheetOpen(true)} style={{ ...iconButtonStyle, width: 'auto', padding: '0 8px', gap: 4 }}>
              <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 500 }}>{filters.sort}</span>
              <ChevronDown size={14} color={COLORS.textSecondary} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 12px 12px 12px' }}>
        {loading ? (
          <div style={{ color: COLORS.textSecondary, textAlign: 'center', padding: '26px 0' }}>Loading SKU velocity...</div>
        ) : (
          visibleSkus.map((sku) => {
            const actionLabel = getActionLabel(sku);
            const isExpanded = expandedSkuIds.includes(sku.id);
            const badge = statusBadgeMap[sku.status];
            return (
              <div key={sku.id} style={{ marginBottom: 8 }}>
                <div
                  onClick={() => openRow(sku.id)}
                  style={{
                    borderRadius: 12,
                    background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    padding: '14px 16px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{sku.name}</p>
                    <span style={{
                      height: 24,
                      borderRadius: 20,
                      border: `1px solid ${badge.border}`,
                      background: badge.bg,
                      color: badge.text,
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '0 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}>
                      {sku.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, gap: 10, alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: 12, color: COLORS.textSecondary }}>{sku.pinCode} - {sku.area}</p>
                    <p style={{ margin: 0, fontSize: 12, color: sku.velocityChangePercent >= 0 ? COLORS.success : COLORS.danger, fontWeight: 500 }}>
                      {formatPercent(sku.velocityChangePercent)}
                    </p>
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, fontSize: 12 }}>
                    <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{sku.unitsSold7d} units</span>
                    <span style={{ color: COLORS.textMuted }}>·</span>
                    <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{sku.sellRatePerDay}/day</span>
                    <span style={{ color: COLORS.textMuted }}>·</span>
                    <span style={{ color: getDaysRiskColor(sku.stockoutDays), fontWeight: 600 }}>{sku.stockoutDays} days left</span>
                  </div>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onAction(sku);
                    }}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      height: 34,
                      borderRadius: 8,
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.input,
                      color: COLORS.textPrimary,
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {actionLabel}
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ borderLeft: `1px solid ${COLORS.border}`, borderRight: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden' }}>
                    {(sku.kiranas || []).map((kirana) => (
                      <div key={kirana.id} style={{ background: COLORS.page, padding: '10px 16px', borderBottom: `1px solid ${COLORS.border}`, display: 'grid', gridTemplateColumns: '1.2fr 0.7fr 0.8fr 0.7fr', gap: 8, fontSize: 11 }}>
                        <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>{kirana.name}</span>
                        <span style={{ color: COLORS.textPrimary }}>{kirana.unitsHeld} units</span>
                        <span style={{ color: COLORS.textSecondary }}>{formatDate(kirana.lastRestock)}</span>
                        <span style={{ color: getDaysRiskColor(kirana.daysUntilEmpty), fontWeight: 500 }}>{kirana.daysUntilEmpty}d</span>
                      </div>
                    ))}
                    {sku.kiranas.length === 0 && (
                      <div style={{ background: COLORS.page, padding: '10px 16px', color: COLORS.textSecondary, fontSize: 12 }}>
                        No kirana stock rows available.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomSheet
        open={sortSheetOpen}
        title="Sort by"
        onClose={() => setSortSheetOpen(false)}
        footer={
          <button onClick={() => setSortSheetOpen(false)} style={confirmButtonStyle}>Confirm</button>
        }
      >
        {SORT_OPTIONS.map((sortOption) => (
          <label key={sortOption} style={radioRowStyle}>
            <input
              type="radio"
              checked={filters.sort === sortOption}
              onChange={() => setSort(sortOption)}
            />
            <span>{sortOption}</span>
          </label>
        ))}
      </BottomSheet>

      <BottomSheet
        open={filterSheetOpen}
        title="Filters"
        onClose={() => setFilterSheetOpen(false)}
        footer={<button onClick={() => { loadSkus(); setFilterSheetOpen(false); }} style={confirmButtonStyle}>Apply filters</button>}
      >
        <div style={{ marginBottom: 12 }}>
          <p style={sheetLabelStyle}>City</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CITY_OPTIONS.map((city) => (
              <button
                key={city}
                onClick={() => setCity(city)}
                style={pillButtonStyle(filters.city === city)}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <p style={sheetLabelStyle}>Date range</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DATE_OPTIONS.map((dateRange) => (
              <button
                key={dateRange}
                onClick={() => setDateRange(dateRange)}
                style={pillButtonStyle(filters.dateRange === dateRange)}
              >
                {dateRange}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={sheetLabelStyle}>Category</p>
            <button onClick={clearCategoryFilters} style={{ background: 'transparent', border: 0, color: COLORS.textSecondary, fontSize: 12 }}>Clear</button>
          </div>
          {categories.map((category) => {
            const selected = filters.category.includes(category);
            return (
              <label key={category} style={checkRowStyle}>
                <input type="checkbox" checked={selected} onChange={() => toggleCategory(category)} />
                <span>{category}</span>
              </label>
            );
          })}
        </div>
      </BottomSheet>

      <BottomSheet
        open={shareSheetOpen}
        title="Share"
        onClose={() => setShareSheetOpen(false)}
      >
        {['Export CSV', 'Export PDF', 'Copy summary'].map((option) => (
          <button key={option} onClick={() => setShareSheetOpen(false)} style={shareRowStyle}>{option}</button>
        ))}
      </BottomSheet>

      <BottomSheet
        open={actionSheet.open}
        title={actionSheet.action || 'Action'}
        onClose={() => setActionSheet({ open: false, sku: null, action: '' })}
        footer={<button onClick={confirmAction} style={confirmButtonStyle}>Continue</button>}
      >
        <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 0 }}>
          {actionSheet.sku ? rowActionDescription(actionSheet.action, actionSheet.sku) : ''}
        </p>
        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, background: COLORS.input, fontSize: 12 }}>
          <p style={{ margin: 0, color: COLORS.textPrimary, fontWeight: 600 }}>{actionSheet.sku?.name}</p>
          <p style={{ margin: '4px 0 0 0', color: COLORS.textSecondary }}>
            {actionSheet.sku?.pinCode} - {actionSheet.sku?.area}
          </p>
        </div>
      </BottomSheet>
    </div>
  );
};

const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.input,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const confirmButtonStyle: React.CSSProperties = {
  width: '100%',
  height: 38,
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.accent,
  color: COLORS.onAccent,
  fontSize: 13,
  fontWeight: 600,
};

const sheetLabelStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  color: COLORS.textSecondary,
  fontSize: 12,
  fontWeight: 500,
};

const radioRowStyle: React.CSSProperties = {
  height: 38,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: COLORS.textPrimary,
  fontSize: 13,
  borderBottom: `1px solid ${COLORS.border}`,
};

const checkRowStyle: React.CSSProperties = {
  height: 34,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: COLORS.textPrimary,
  fontSize: 13,
};

const shareRowStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.input,
  color: COLORS.textPrimary,
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 8,
  textAlign: 'left',
  padding: '0 12px',
};

function pillButtonStyle(active: boolean): React.CSSProperties {
  return {
    height: 30,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: active ? COLORS.accent : COLORS.input,
    color: active ? COLORS.onAccent : COLORS.textSecondary,
    padding: '0 10px',
    fontSize: 12,
    fontWeight: 500,
  };
}

const BottomSheet: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-overlay)',
        zIndex: 70,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 700,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        border: `1px solid ${COLORS.border}`,
        borderBottom: 'none',
        background: COLORS.card,
        padding: 14,
      }}>
        <div style={{ width: 50, height: 4, borderRadius: 999, background: COLORS.border, margin: '2px auto 10px auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{title}</p>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: COLORS.textSecondary }}>
            <Check size={16} />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div style={{ marginTop: 12 }}>{footer}</div>}
      </div>
    </div>
  );
};

export default SkuVelocityPage;
