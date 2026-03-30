import { create } from 'zustand';
import {
  createCampaign as createCampaignApi,
  fetchCampaignStats,
  fetchCampaigns,
  updateCampaignStatus,
  type CampaignCreateBody,
  type CampaignItem,
  type CampaignMeta,
  type CampaignStatsResponse,
  type CampaignTrigger,
} from '../services/campaignService';

type FilterStatus = 'All' | 'Live' | 'Scheduled' | 'Paused' | 'Ended';

interface CampaignForm {
  skuId: string;
  pinCodes: string[];
  message: string;
  trigger: CampaignTrigger;
  budget: string;
  name: string;
}

interface CampaignState {
  campaigns: CampaignItem[];
  filters: { status: FilterStatus };
  loading: boolean;
  createForm: CampaignForm;
  meta: CampaignMeta;
  selectedCampaign: CampaignItem | null;
  selectedCampaignStats: CampaignStatsResponse | null;
  loadCampaigns: () => Promise<void>;
  setStatusFilter: (status: FilterStatus) => void;
  setFormField: <K extends keyof CampaignForm>(field: K, value: CampaignForm[K]) => void;
  addPinCode: (pinCode: string) => void;
  removePinCode: (pinCode: string) => void;
  resetForm: () => void;
  createCampaign: () => Promise<CampaignItem | null>;
  selectCampaign: (campaign: CampaignItem | null) => void;
  loadSelectedCampaignStats: (id: string) => Promise<void>;
  patchSelectedCampaignStatus: (status: 'paused' | 'ended') => Promise<void>;
}

const defaultMeta: CampaignMeta = {
  activeCount: 0,
  alertsSentMonth: 0,
  actionRate: 0,
  avgROI: 0,
};

const defaultForm: CampaignForm = {
  skuId: '',
  pinCodes: [],
  message: '',
  trigger: 'Immediately (manual)',
  budget: '',
  name: '',
};

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  filters: { status: 'All' },
  loading: false,
  createForm: defaultForm,
  meta: defaultMeta,
  selectedCampaign: null,
  selectedCampaignStats: null,

  loadCampaigns: async () => {
    set({ loading: true });
    const data = await fetchCampaigns();
    set({ campaigns: data.campaigns, meta: data.meta, loading: false });
  },

  setStatusFilter: (status) => set({ filters: { status } }),

  setFormField: (field, value) => set((state) => ({
    createForm: { ...state.createForm, [field]: value },
  })),

  addPinCode: (pinCode) => set((state) => {
    if (state.createForm.pinCodes.includes(pinCode)) return state;
    return {
      createForm: {
        ...state.createForm,
        pinCodes: [...state.createForm.pinCodes, pinCode],
      },
    };
  }),

  removePinCode: (pinCode) => set((state) => ({
    createForm: {
      ...state.createForm,
      pinCodes: state.createForm.pinCodes.filter((p) => p !== pinCode),
    },
  })),

  resetForm: () => set({ createForm: defaultForm }),

  createCampaign: async () => {
    const form = get().createForm;
    const payload: CampaignCreateBody = {
      skuId: form.skuId,
      pinCodes: form.pinCodes,
      message: form.message,
      trigger: form.trigger,
      budget: Number(form.budget || 0),
      name: form.name,
    };

    if (!payload.skuId || payload.pinCodes.length === 0 || !payload.message || !payload.name || payload.budget <= 0) {
      return null;
    }

    const created = await createCampaignApi(payload);
    set((state) => {
      const campaigns = [created, ...state.campaigns];
      return {
        campaigns,
        meta: {
          activeCount: campaigns.filter((c) => c.status === 'Live').length,
          alertsSentMonth: campaigns.reduce((sum, c) => sum + c.alertsSent, 0),
          actionRate: campaigns.length ? Math.round(campaigns.reduce((sum, c) => sum + c.actionRate, 0) / campaigns.length) : 0,
          avgROI: campaigns.length ? Number((campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length).toFixed(2)) : 0,
        },
      };
    });

    return created;
  },

  selectCampaign: (campaign) => set({ selectedCampaign: campaign, selectedCampaignStats: null }),

  loadSelectedCampaignStats: async (id) => {
    const stats = await fetchCampaignStats(id);
    set({ selectedCampaignStats: stats });
  },

  patchSelectedCampaignStatus: async (status) => {
    const selected = get().selectedCampaign;
    if (!selected) return;

    await updateCampaignStatus(selected.id, status);
    const nextStatus = status === 'paused' ? 'Paused' : 'Ended';

    set((state) => ({
      campaigns: state.campaigns.map((c) => (c.id === selected.id ? { ...c, status: nextStatus } : c)),
      selectedCampaign: { ...selected, status: nextStatus },
    }));
  },
}));

export function visibleCampaigns(campaigns: CampaignItem[], status: FilterStatus): CampaignItem[] {
  if (status === 'All') return campaigns;
  return campaigns.filter((campaign) => campaign.status === status);
}

export function elapsedDaysSince(isoDate: string): number {
  const diff = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}
