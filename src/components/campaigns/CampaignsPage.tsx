import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronDown, Plus, X } from 'lucide-react';
import { fetchSkuVelocity, type SkuVelocityItem } from '../../services/skuVelocityService';
import {
  useCampaignStore,
  elapsedDaysSince,
  visibleCampaigns,
} from '../../store/campaignStore';
import type { CampaignItem, CampaignTrigger } from '../../services/campaignService';

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

const TRIGGERS: CampaignTrigger[] = [
  'Demand spike >30%',
  'Stock < 7 days',
  'Stock < 14 days',
  'Immediately (manual)',
  'Scheduled date',
];

const statusStyle = {
  Live: { bg: 'var(--status-optimal-bg)', text: 'var(--status-optimal-text)', border: 'var(--status-optimal-border)' },
  Scheduled: { bg: 'var(--status-low-bg)', text: 'var(--status-low-text)', border: 'var(--status-low-border)' },
  Paused: { bg: 'var(--color-surface-2)', text: 'var(--color-text-secondary)', border: 'var(--color-border)' },
  Ended: { bg: 'var(--status-excess-bg)', text: 'var(--status-excess-text)', border: 'var(--status-excess-border)' },
} as const;

const headerButton: React.CSSProperties = {
  background: COLORS.accent,
  color: COLORS.onAccent,
  borderRadius: 10,
  border: 0,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 40,
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.input,
  color: COLORS.textPrimary,
  padding: '10px 12px',
  fontSize: 13,
  outline: 'none',
};

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

const CampaignsPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement | null>(null);
  const pinInputRef = useRef<HTMLInputElement | null>(null);

  const {
    campaigns,
    filters,
    loading,
    createForm,
    meta,
    selectedCampaign,
    selectedCampaignStats,
    loadCampaigns,
    setStatusFilter,
    setFormField,
    addPinCode,
    removePinCode,
    createCampaign,
    selectCampaign,
    loadSelectedCampaignStats,
    patchSelectedCampaignStatus,
    resetForm,
  } = useCampaignStore();

  const [skuSheetOpen, setSkuSheetOpen] = useState(false);
  const [triggerSheetOpen, setTriggerSheetOpen] = useState(false);
  const [suggestedPinsOpen, setSuggestedPinsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [whatsappPreviewOpen, setWhatsappPreviewOpen] = useState(false);
  const [pinDraft, setPinDraft] = useState('');
  const [skuOptions, setSkuOptions] = useState<SkuVelocityItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
    fetchSkuVelocity().then((data) => setSkuOptions(data.skus));
  }, [loadCampaigns]);

  useEffect(() => {
    if (!selectedCampaign) return;
    loadSelectedCampaignStats(selectedCampaign.id);
  }, [selectedCampaign, loadSelectedCampaignStats]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const listed = useMemo(() => visibleCampaigns(campaigns, filters.status), [campaigns, filters.status]);

  const selectedSku = useMemo(
    () => skuOptions.find((sku) => sku.id === createForm.skuId) || null,
    [skuOptions, createForm.skuId]
  );

  const suggestedPins = useMemo(() => {
    if (!selectedSku) return [];
    const base = selectedSku.pinCode.slice(0, 3);
    return [`${base}045`, `${base}016`, `${base}038`, `${base}001`, `${base}052`];
  }, [selectedSku]);

  const estimatedReach = createForm.pinCodes.length * 48;

  const addPinFromDraft = () => {
    const sanitized = pinDraft.replace(/\D/g, '').slice(0, 6);
    if (sanitized.length === 6) {
      addPinCode(sanitized);
    }
    setPinDraft('');
  };

  const onPinKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === ' ' || event.key === ',' || event.key === 'Enter') {
      event.preventDefault();
      addPinFromDraft();
    }
  };

  const onPreviewCampaign = () => {
    if (!createForm.skuId || createForm.pinCodes.length === 0 || !createForm.message.trim() || !createForm.name.trim() || !createForm.budget.trim()) {
      setToast('Please complete all fields before preview.');
      return;
    }
    setPreviewOpen(true);
  };

  const onLaunchCampaign = async () => {
    const created = await createCampaign();
    if (!created) {
      setToast('Form data is incomplete.');
      return;
    }
    setPreviewOpen(false);
    resetForm();
    setToast('Campaign launched successfully.');
    await loadCampaigns();
  };

  const renderCampaignCard = (campaign: CampaignItem) => {
    const isScheduled = campaign.status === 'Scheduled';
    const createdDays = elapsedDaysSince(campaign.createdAt);
    const roiColor = campaign.roi > 1 ? COLORS.success : COLORS.danger;

    return (
      <div
        key={campaign.id}
        onClick={() => selectCampaign(campaign)}
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 10,
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
          <p style={{ margin: 0, color: COLORS.textPrimary, fontSize: 14, fontWeight: 600 }}>{campaign.name}</p>
          <span style={{
            borderRadius: 20,
            border: `1px solid ${statusStyle[campaign.status].border}`,
            background: statusStyle[campaign.status].bg,
            color: statusStyle[campaign.status].text,
            fontSize: 11,
            fontWeight: 500,
            padding: '3px 10px',
          }}>
            {campaign.status}
          </span>
        </div>

        <p style={{ margin: '5px 0 10px 0', fontSize: 12, color: COLORS.textSecondary }}>
          {campaign.skuName} · {campaign.pinCodes[0]} area · triggered {createdDays} days ago
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <StatBlock label="Alerts sent" value={campaign.alertsSent} muted={isScheduled} prefix={isScheduled ? 'Est. ' : ''} color={COLORS.textPrimary} />
          <StatBlock label="Acted" value={`${campaign.actionRate}%`} muted={isScheduled} prefix={isScheduled ? 'Est. ' : ''} color={COLORS.success} />
          <StatBlock label="ROI per ₹1" value={`₹${campaign.roi.toFixed(2)}`} muted={isScheduled} prefix={isScheduled ? 'Est. ' : ''} color={roiColor} />
        </div>

        {campaign.status === 'Live' && (
          <div style={{ marginTop: 10 }}>
            <div style={{ background: COLORS.input, height: 4, borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.round((campaign.budgetUsed / Math.max(campaign.budget, 1)) * 100))}%`,
                  background: COLORS.accent,
                  height: '100%',
                }}
              />
            </div>
            <p style={{ margin: '6px 0 0 0', color: COLORS.textMuted, fontSize: 11 }}>
              {money(campaign.budgetUsed)} of {money(campaign.budget)} budget used
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: COLORS.page, borderRadius: 16, border: `1px solid ${COLORS.border}`, minHeight: '100%', padding: 12, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, color: COLORS.textPrimary, fontSize: 18, fontWeight: 600 }}>Campaigns</p>
          <p style={{ margin: '2px 0 0 0', color: COLORS.textSecondary, fontSize: 12 }}>Sponsored surge alerts</p>
        </div>
        <button style={headerButton} onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          <Plus size={14} /> New campaign
        </button>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', gap: 10, paddingBottom: 8, marginBottom: 12 }}>
        <MetricCard label="Active campaigns" value={meta.activeCount.toLocaleString('en-IN')} />
        <MetricCard label="Alerts sent" value={meta.alertsSentMonth.toLocaleString('en-IN')} sub="this month" />
        <MetricCard label="Kiranas acted" value={`${meta.actionRate}%`} sub="reordered within 48h" valueColor={COLORS.success} />
        <MetricCard label="Avg ROI" value={`₹${meta.avgROI.toFixed(2)}`} sub="per ₹1 spent" valueColor={COLORS.success} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>Active campaigns</p>
          <button style={{ border: 0, background: 'transparent', color: COLORS.accent, fontWeight: 600, fontSize: 12 }} onClick={() => setStatusFilter('All')}>View all</button>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10 }}>
          {(['All', 'Live', 'Scheduled', 'Paused', 'Ended'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                height: 30,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: filters.status === status ? COLORS.accent : COLORS.input,
                color: filters.status === status ? COLORS.onAccent : COLORS.textSecondary,
                fontSize: 12,
                padding: '0 10px',
                whiteSpace: 'nowrap',
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: COLORS.textSecondary, padding: '14px 0' }}>Loading campaigns...</div>
        ) : listed.length > 0 ? (
          listed.map(renderCampaignCard)
        ) : campaigns.length === 0 ? (
          <div style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <p style={{ margin: 0, color: COLORS.textPrimary, fontWeight: 600 }}>No campaigns yet</p>
            <p style={{ margin: '8px 0 12px 0', color: COLORS.textSecondary, fontSize: 12 }}>
              Create your first surge alert to start driving reorders from kiranas in your target areas
            </p>
            <button style={headerButton} onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Create campaign</button>
          </div>
        ) : (
          <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>No campaigns match this filter.</div>
        )}
      </div>

      <div ref={formRef}>
        <p style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>Create new campaign</p>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16 }}>
          <FieldLabel label="Select SKU" />
          <button style={{ ...inputStyle, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setSkuSheetOpen(true)}>
            <span style={{ color: selectedSku ? COLORS.textPrimary : COLORS.textSecondary }}>
              {selectedSku
                ? `${selectedSku.name} · ${selectedSku.status} · ${selectedSku.stockoutDays} days left`
                : 'Choose a SKU'}
            </span>
            <ChevronDown size={14} color={COLORS.textSecondary} />
          </button>

          <FieldLabel label="Target pin codes" />
          <div style={{ ...inputStyle, minHeight: 44, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: 8 }}>
            {createForm.pinCodes.map((pin) => (
              <span key={pin} style={{
                height: 26,
                borderRadius: 8,
                padding: '0 8px',
                border: '1px solid rgba(124,92,252,0.4)',
                background: 'rgba(124,92,252,0.2)',
                color: COLORS.accent,
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}>
                {pin}
                <button style={{ border: 0, background: 'transparent', color: COLORS.accent, padding: 0, cursor: 'pointer' }} onClick={() => removePinCode(pin)}>
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              ref={pinInputRef}
              value={pinDraft}
              onChange={(event) => setPinDraft(event.target.value)}
              onKeyDown={onPinKeyDown}
              onBlur={addPinFromDraft}
              style={{ border: 0, outline: 'none', background: 'transparent', color: COLORS.textPrimary, minWidth: 120, flex: 1 }}
              placeholder="Type pin code"
            />
          </div>
          <button style={{ marginTop: 7, border: 0, background: 'transparent', color: COLORS.accent, fontSize: 12 }} onClick={() => setSuggestedPinsOpen(true)}>
            Suggested based on your SKU velocity data
          </button>

          <FieldLabel label="Message to kiranas (sent via WhatsApp)" />
          <textarea
            value={createForm.message}
            onChange={(event) => setFormField('message', event.target.value.slice(0, 160))}
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <button style={{ border: 0, background: 'transparent', color: COLORS.accent, fontSize: 12 }} onClick={() => setWhatsappPreviewOpen(true)}>
              Preview how kiranas will see this
            </button>
            <span style={{ color: COLORS.textSecondary, fontSize: 11 }}>{createForm.message.length}/160</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <div>
              <FieldLabel label="Send when" />
              <button style={{ ...inputStyle, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setTriggerSheetOpen(true)}>
                <span style={{ color: COLORS.textPrimary, fontSize: 12 }}>{createForm.trigger}</span>
                <ChevronDown size={14} color={COLORS.textSecondary} />
              </button>
            </div>
            <div>
              <FieldLabel label="Monthly budget" />
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px' }}>
                <span style={{ color: COLORS.textSecondary }}>₹</span>
                <input
                  value={createForm.budget}
                  onChange={(event) => setFormField('budget', event.target.value.replace(/[^\d]/g, ''))}
                  placeholder="5,000"
                  style={{ border: 0, outline: 'none', background: 'transparent', color: COLORS.textPrimary, width: '100%' }}
                />
              </div>
            </div>
          </div>

          <FieldLabel label="Campaign name (internal only)" />
          <input
            value={createForm.name}
            onChange={(event) => setFormField('name', event.target.value)}
            style={inputStyle}
            placeholder="e.g. Lays Baner Pre-Summer"
          />

          <button
            onClick={onPreviewCampaign}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 10,
              border: 0,
              marginTop: 12,
              background: COLORS.accent,
              color: COLORS.onAccent,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Preview campaign
          </button>
        </div>
      </div>

      {skuSheetOpen && (
        <BottomSheet title="Select SKU" onClose={() => setSkuSheetOpen(false)}>
          {skuOptions.map((sku) => (
            <button
              key={sku.id}
              onClick={() => {
                setFormField('skuId', sku.id);
                setSkuSheetOpen(false);
              }}
              style={sheetRowButton}
            >
              <span style={{ color: COLORS.textPrimary }}>{sku.name}</span>
              <span style={{ color: COLORS.textSecondary, fontSize: 12 }}>{sku.status} · {sku.stockoutDays} days left</span>
            </button>
          ))}
        </BottomSheet>
      )}

      {triggerSheetOpen && (
        <BottomSheet title="Trigger condition" onClose={() => setTriggerSheetOpen(false)}>
          {TRIGGERS.map((trigger) => (
            <button
              key={trigger}
              onClick={() => {
                setFormField('trigger', trigger);
                setTriggerSheetOpen(false);
              }}
              style={sheetRowButton}
            >
              <span style={{ color: COLORS.textPrimary }}>{trigger}</span>
            </button>
          ))}
        </BottomSheet>
      )}

      {suggestedPinsOpen && (
        <ModalCard title="Suggested high-demand pin codes" onClose={() => setSuggestedPinsOpen(false)}>
          {suggestedPins.map((pin) => (
            <button key={pin} onClick={() => addPinCode(pin)} style={sheetRowButton}>{pin}</button>
          ))}
        </ModalCard>
      )}

      {whatsappPreviewOpen && (
        <ModalCard title="WhatsApp preview" onClose={() => setWhatsappPreviewOpen(false)}>
          <div style={{ background: '#0b141a', borderRadius: 12, padding: 10 }}>
            <div style={{ background: '#202c33', color: '#d9fdd3', borderRadius: 10, padding: 10, marginLeft: '20%', fontSize: 13 }}>
              {createForm.message || 'Your message preview will appear here.'}
            </div>
          </div>
        </ModalCard>
      )}

      {previewOpen && (
        <ModalCard title="Campaign preview" onClose={() => setPreviewOpen(false)}>
          <div style={{ background: COLORS.input, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: 12, fontSize: 13 }}>
            <p style={previewLine}><strong>Campaign:</strong> {createForm.name}</p>
            <p style={previewLine}><strong>SKU:</strong> {selectedSku?.name || '-'}</p>
            <p style={previewLine}><strong>Pin codes:</strong> {createForm.pinCodes.join(', ') || '-'}</p>
            <p style={previewLine}><strong>Trigger:</strong> {createForm.trigger}</p>
            <p style={previewLine}><strong>Budget:</strong> ₹{Number(createForm.budget || 0).toLocaleString('en-IN')}</p>
            <p style={previewLine}><strong>Estimated reach:</strong> {estimatedReach.toLocaleString('en-IN')} kiranas</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <button style={secondaryButton} onClick={() => setPreviewOpen(false)}>Edit</button>
            <button style={primaryButton} onClick={onLaunchCampaign}>Launch campaign</button>
          </div>
        </ModalCard>
      )}

      {selectedCampaign && (
        <ModalCard title="Campaign detail" onClose={() => selectCampaign(null)} wide>
          <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.input, borderRadius: 10, padding: 10 }}>
            <p style={previewLine}><strong>Name:</strong> {selectedCampaign.name}</p>
            <p style={previewLine}><strong>SKU:</strong> {selectedCampaign.skuName}</p>
            <p style={previewLine}><strong>Status:</strong> {selectedCampaign.status}</p>
            <p style={previewLine}><strong>Alerts sent:</strong> {selectedCampaign.alertsSent.toLocaleString('en-IN')}</p>
            <p style={previewLine}><strong>Action rate:</strong> {selectedCampaign.actionRate}%</p>
          </div>

          <div style={{ marginTop: 12, height: 180 }}>
            <p style={{ margin: '0 0 8px 0', color: COLORS.textPrimary, fontWeight: 600, fontSize: 13 }}>Alerts timeline</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={selectedCampaignStats?.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="day" stroke={COLORS.textSecondary} fontSize={11} />
                <YAxis stroke={COLORS.textSecondary} fontSize={11} />
                <Tooltip />
                <Bar dataKey="alerts" fill="#7C5CFC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: 10 }}>
            <p style={{ margin: '0 0 8px 0', color: COLORS.textPrimary, fontWeight: 600, fontSize: 13 }}>Kiranas acted</p>
            {(selectedCampaignStats?.kiranasActed || []).length === 0 ? (
              <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 12 }}>No kirana actions recorded yet.</p>
            ) : (
              (selectedCampaignStats?.kiranasActed || []).map((kirana) => (
                <div key={kirana.id} style={{
                  borderBottom: `1px solid ${COLORS.border}`,
                  padding: '8px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  color: COLORS.textSecondary,
                  fontSize: 12,
                }}>
                  <span>{kirana.name}</span>
                  <span>{new Date(kirana.actedAt).toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button style={secondaryButton} onClick={() => patchSelectedCampaignStatus('paused')}>Pause</button>
            <button style={{ ...secondaryButton, color: COLORS.danger, borderColor: COLORS.danger }} onClick={() => patchSelectedCampaignStatus('ended')}>End</button>
          </div>
        </ModalCard>
      )}

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-toast-bg)',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: '10px 14px',
          color: COLORS.onAccent,
          fontSize: 12,
          zIndex: 120,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

const FieldLabel: React.FC<{ label: string }> = ({ label }) => (
  <p style={{ margin: '12px 0 6px 0', fontSize: 12, color: COLORS.textMuted }}>{label}</p>
);

const MetricCard: React.FC<{ label: string; value: string; sub?: string; valueColor?: string }> = ({ label, value, sub, valueColor }) => (
  <div style={{ width: 140, height: 80, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, flexShrink: 0 }}>
    <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 11 }}>{label}</p>
    <p style={{ margin: '6px 0 2px 0', color: valueColor || COLORS.textPrimary, fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
    {sub && <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 11 }}>{sub}</p>}
  </div>
);

const StatBlock: React.FC<{ label: string; value: string | number; color: string; muted?: boolean; prefix?: string }> = ({ label, value, color, muted, prefix }) => (
  <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, background: muted ? 'var(--color-surface-2)' : COLORS.input, padding: 8 }}>
    <p style={{ margin: 0, color: muted ? COLORS.textMuted : color, fontWeight: 600, fontSize: 18 }}>{prefix}{value}</p>
    <p style={{ margin: '2px 0 0 0', color: COLORS.textSecondary, fontSize: 11 }}>{label}</p>
  </div>
);

const BottomSheet: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div style={overlayStyle} onClick={(event) => event.target === event.currentTarget && onClose()}>
    <div style={sheetStyle}>
      <p style={{ margin: '0 0 8px 0', color: COLORS.textPrimary, fontWeight: 600 }}>{title}</p>
      {children}
    </div>
  </div>
);

const ModalCard: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => (
  <div style={overlayStyle} onClick={(event) => event.target === event.currentTarget && onClose()}>
    <div style={{ ...sheetStyle, maxWidth: wide ? 760 : 620, borderRadius: 12, borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ margin: 0, color: COLORS.textPrimary, fontWeight: 600 }}>{title}</p>
        <button onClick={onClose} style={{ border: 0, background: 'transparent', color: COLORS.textSecondary }}><X size={14} /></button>
      </div>
      {children}
    </div>
  </div>
);

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'var(--color-overlay)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
};

const sheetStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 680,
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderBottom: 'none',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  padding: 14,
  maxHeight: '82vh',
  overflowY: 'auto',
};

const sheetRowButton: React.CSSProperties = {
  width: '100%',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: COLORS.input,
  padding: '9px 10px',
  marginBottom: 8,
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const previewLine: React.CSSProperties = { margin: '0 0 6px 0', color: COLORS.textSecondary, fontSize: 12 };

const primaryButton: React.CSSProperties = {
  height: 38,
  borderRadius: 10,
  border: 0,
  background: COLORS.accent,
  color: COLORS.onAccent,
  fontWeight: 600,
};

const secondaryButton: React.CSSProperties = {
  height: 38,
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.input,
  color: COLORS.textPrimary,
  fontWeight: 600,
};

export default CampaignsPage;
