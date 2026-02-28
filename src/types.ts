
export enum UserRole {
  RETAILER = 'RETAILER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  MANUFACTURER = 'MANUFACTURER'
}

export enum ShopType {
  GROCERY = 'GROCERY',
  ELECTRONICS = 'ELECTRONICS'
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type LanguageCode = 
  | 'EN' | 'HI' | 'AS' | 'BN' | 'BRX' | 'DOI' | 'GU' | 'KN' | 'KS' | 'KOK' 
  | 'MAI' | 'ML' | 'MNI' | 'MR' | 'NE' | 'OR' | 'PA' | 'SA' | 'SAT' | 'SD' | 'TA' | 'TE' | 'UR';

export type MovementType = 'IN' | 'OUT';

export interface StockLog {
  id: string;
  skuId: string;
  type: MovementType;
  quantity: number;
  price?: number;
  reason: string;
  timestamp: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK';
export type PaymentStatus = 'COMPLETED' | 'PENDING';
export type PaymentType = 'RECEIVED' | 'PAID';

export interface Payment {
  id: string;
  party: string;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  note?: string;
  date: string;
}

export interface BusinessConnection {
  id: string;
  businessId: string;
  name: string;
  shopName?: string;
  role: UserRole;
  city?: string;
  status: 'PENDING' | 'CONNECTED';
  direction?: 'outgoing' | 'incoming';
}

export interface SKU {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  openingStock: number;
  totalIn: number;
  totalOut: number;
  currentStock: number;
  minThreshold: number;
  lastUpdated: string;
  status: 'OPTIMAL' | 'LOW' | 'EXCESS' | 'CRITICAL';
  expiryDate?: string; // ISO date string e.g. "2026-03-15"
}

export interface AIInsight {
  skuId: string;
  action: string;
  quantity: string;
  reason: string;
  impact: string;
}

export type GeolocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';

export interface NearbyStore {
  id: string;
  name: string;
  distance_km: number;
  lat: number;
  lng: number;
  address?: string;
  category?: string;
}

export interface UserProfile {
  id: string; // Merchant/Dist/Retailer ID
  name: string;
  phone: string;
  email: string;
  password?: string;
  shopName: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  businessCategory?: string;
  establishedYear?: string;
  bioAuthEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface AppState {
  isLoggedIn: boolean;
  role?: UserRole;
  shopType?: ShopType;
  language: LanguageCode;
  themeMode: ThemeMode;
  location?: {
    state: string;
    city: string;
    lat: number;
    lng: number;
  };
  cashPrivacyMode: boolean;
  inventory: SKU[];
  movementLogs: StockLog[];
  expenses: Expense[];
  payments: Payment[];
  budget: number;
  connections: BusinessConnection[];
  landingCompleted: boolean;
  signupCompleted: boolean;
  onboarded: boolean;
  onboardingStep: number;
  profile: UserProfile;
  geolocationStatus: GeolocationStatus;
  nearestStores: NearbyStore[];
}
