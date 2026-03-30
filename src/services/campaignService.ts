export type CampaignStatus = 'Live' | 'Scheduled' | 'Paused' | 'Ended';

export type CampaignTrigger =
  | 'Demand spike >30%'
  | 'Stock < 7 days'
  | 'Stock < 14 days'
  | 'Immediately (manual)'
  | 'Scheduled date';

export interface CampaignKiranaAction {
  id: string;
  name: string;
  actedAt: string;
  action: 'Reordered' | 'Requested callback';
}

export interface CampaignItem {
  id: string;
  name: string;
  skuId: string;
  skuName: string;
  pinCodes: string[];
  message: string;
  trigger: CampaignTrigger;
  budget: number;
  budgetUsed: number;
  status: CampaignStatus;
  alertsSent: number;
  actionRate: number;
  roi: number;
  createdAt: string;
  kiranas: CampaignKiranaAction[];
}

export interface CampaignMeta {
  activeCount: number;
  alertsSentMonth: number;
  actionRate: number;
  avgROI: number;
}

export interface CampaignResponse {
  campaigns: CampaignItem[];
  meta: CampaignMeta;
}

export interface CampaignCreateBody {
  skuId: string;
  pinCodes: string[];
  message: string;
  trigger: CampaignTrigger;
  budget: number;
  name: string;
}

export interface CampaignStatsResponse {
  campaignId: string;
  timeline: Array<{ day: string; alerts: number }>;
  kiranasActed: CampaignKiranaAction[];
}

const MOCK_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'cmp-101',
    name: 'Lays Baner Pre-Summer',
    skuId: 'sku-101',
    skuName: 'Lays Magic Masala 52g',
    pinCodes: ['411045', '411007', '411038'],
    message: 'High demand incoming. Keep 2x stock for weekend surge.',
    trigger: 'Demand spike >30%',
    budget: 12000,
    budgetUsed: 7600,
    status: 'Live',
    alertsSent: 962,
    actionRate: 42,
    roi: 1.46,
    createdAt: '2026-03-23T10:00:00.000Z',
    kiranas: [
      { id: 'k1', name: 'Shri Datta Stores', actedAt: '2026-03-25T11:25:00.000Z', action: 'Reordered' },
      { id: 'k2', name: 'Om Kirana Mart', actedAt: '2026-03-25T14:08:00.000Z', action: 'Reordered' },
    ],
  },
  {
    id: 'cmp-102',
    name: 'Aata Low Stock Push',
    skuId: 'sku-102',
    skuName: 'Shakti Chakki Aata 10kg',
    pinCodes: ['400076', '400072'],
    message: 'Prevent stockout. Reorder now to avoid weekend shortages.',
    trigger: 'Stock < 7 days',
    budget: 9000,
    budgetUsed: 0,
    status: 'Scheduled',
    alertsSent: 720,
    actionRate: 31,
    roi: 1.12,
    createdAt: '2026-03-26T06:00:00.000Z',
    kiranas: [],
  },
  {
    id: 'cmp-103',
    name: 'Detergent Monsoon Prep',
    skuId: 'sku-103',
    skuName: 'Sparkle Detergent 1kg',
    pinCodes: ['422003', '422002', '422004'],
    message: 'Monsoon demand rise expected. Keep extra pack inventory.',
    trigger: 'Stock < 14 days',
    budget: 10000,
    budgetUsed: 5200,
    status: 'Paused',
    alertsSent: 418,
    actionRate: 25,
    roi: 0.88,
    createdAt: '2026-03-20T08:30:00.000Z',
    kiranas: [
      { id: 'k3', name: 'Shree Sai Super', actedAt: '2026-03-21T09:12:00.000Z', action: 'Reordered' },
    ],
  },
];

function deriveMeta(campaigns: CampaignItem[]): CampaignMeta {
  const activeCount = campaigns.filter((c) => c.status === 'Live').length;
  const alertsSentMonth = campaigns.reduce((sum, c) => sum + c.alertsSent, 0);
  const actionRate = campaigns.length ? Math.round(campaigns.reduce((sum, c) => sum + c.actionRate, 0) / campaigns.length) : 0;
  const avgROI = campaigns.length ? Number((campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length).toFixed(2)) : 0;

  return { activeCount, alertsSentMonth, actionRate, avgROI };
}

export async function fetchCampaigns(): Promise<CampaignResponse> {
  try {
    const response = await fetch('/api/manufacturer/campaigns');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as CampaignResponse;
    return {
      campaigns: data.campaigns ?? [],
      meta: data.meta ?? deriveMeta(data.campaigns ?? []),
    };
  } catch {
    return { campaigns: MOCK_CAMPAIGNS, meta: deriveMeta(MOCK_CAMPAIGNS) };
  }
}

export async function createCampaign(body: CampaignCreateBody): Promise<CampaignItem> {
  try {
    const response = await fetch('/api/manufacturer/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as CampaignItem;
  } catch {
    return {
      id: `cmp-${Date.now()}`,
      name: body.name,
      skuId: body.skuId,
      skuName: 'Selected SKU',
      pinCodes: body.pinCodes,
      message: body.message,
      trigger: body.trigger,
      budget: body.budget,
      budgetUsed: 0,
      status: body.trigger === 'Immediately (manual)' ? 'Live' : 'Scheduled',
      alertsSent: 0,
      actionRate: 0,
      roi: 0,
      createdAt: new Date().toISOString(),
      kiranas: [],
    };
  }
}

export async function updateCampaignStatus(id: string, status: 'paused' | 'ended'): Promise<void> {
  try {
    await fetch(`/api/manufacturer/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch {
    // No-op for demo mode.
  }
}

export async function fetchCampaignStats(id: string): Promise<CampaignStatsResponse> {
  try {
    const response = await fetch(`/api/manufacturer/campaigns/${id}/stats`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as CampaignStatsResponse;
  } catch {
    const selected = MOCK_CAMPAIGNS.find((c) => c.id === id);
    return {
      campaignId: id,
      timeline: [
        { day: 'Mon', alerts: 92 },
        { day: 'Tue', alerts: 121 },
        { day: 'Wed', alerts: 86 },
        { day: 'Thu', alerts: 147 },
        { day: 'Fri', alerts: 168 },
        { day: 'Sat', alerts: 175 },
        { day: 'Sun', alerts: 132 },
      ],
      kiranasActed: selected?.kiranas ?? [],
    };
  }
}
