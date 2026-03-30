# Supabase Implementation Guide - Vyaparika AI Inventory Intelligence

## 1. Environment Setup ✅ (Already Configured)

Your `.env` file already has:
```
SUPABASE_URL=https://rbardnkummibwifmrkyr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyCurxF_kVcNibEqFLvtyRPF5ISaaUIBx2g
```

**Ensure these are in your `.env.local`** for local development.

---

## 2. Database Schema Setup (SQL - Run in Supabase Dashboard)

### Create Tables

Go to `Supabase Dashboard → SQL Editor` and run:

```sql
-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT,
  name TEXT,
  avatar_url TEXT,
  shop_name TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  business_category TEXT,
  gstin TEXT,
  established_year TEXT,
  bio_auth_enabled BOOLEAN DEFAULT FALSE,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INVENTORY (SKUs)
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  price FLOAT,
  opening_stock INT DEFAULT 0,
  total_in INT DEFAULT 0,
  total_out INT DEFAULT 0,
  current_stock INT DEFAULT 0,
  min_threshold INT DEFAULT 5,
  status TEXT DEFAULT 'OPTIMAL', -- OPTIMAL, LOW, EXCESS, CRITICAL
  expiry_date DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STOCK MOVEMENTS LOG
CREATE TABLE IF NOT EXISTS public.stock_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  sku_id TEXT NOT NULL REFERENCES public.user_inventory(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'IN' or 'OUT'
  quantity INT NOT NULL,
  price FLOAT,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount FLOAT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  linked_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  party TEXT NOT NULL,
  amount FLOAT NOT NULL,
  type TEXT NOT NULL, -- 'RECEIVED' or 'PAID'
  method TEXT NOT NULL, -- 'CASH', 'UPI', 'CARD', 'BANK'
  status TEXT DEFAULT 'COMPLETED', -- 'COMPLETED', 'PENDING'
  note TEXT,
  date DATE NOT NULL,
  source TEXT, -- 'expense', 'stock', 'inventory', 'manual'
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BUSINESS CONNECTIONS
CREATE TABLE IF NOT EXISTS public.connections (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STORES (for nearest store feature)
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX idx_stock_logs_user_id ON public.stock_logs(user_id);
CREATE INDEX idx_stock_logs_sku_id ON public.stock_logs(sku_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_connections_follower ON public.connections(follower_id);
CREATE INDEX idx_connections_following ON public.connections(following_id);

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own inventory" ON public.user_inventory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own inventory" ON public.user_inventory
  FOR INSERT USING (auth.uid() = user_id);

-- Continue similar policies for other tables...
```

---

## 3. Supabase Client Setup (Already Done ✅)

File: `src/backend/supabase/supabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing credentials in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 4. Core Services Implementation

### ✅ ALREADY IMPLEMENTED:
- `authService.ts` - Google OAuth, Phone OTP, Email auth
- `connectionsService.ts` - Business networking
- `expensesService.ts` - Expense tracking
- `locationService.ts` - Geolocation & nearby stores
- `notificationService.ts` - Alert system

### 📋 NEEDS IMPLEMENTATION:

#### A. Inventory Service (`src/services/inventoryService.ts`)

```typescript
import { supabase } from '../backend/supabase';
import type { SKU, StockLog, MovementType } from '../types';

// ─── Inventory CRUD ──────────────────────────────────────────────

/**
 * Fetch all SKUs for a user
 */
export async function fetchInventory(userId: string): Promise<SKU[]> {
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
}

/**
 * Add a new SKU/product
 */
export async function addSku(
  userId: string,
  sku: Omit<SKU, 'id' | 'lastUpdated' | 'totalIn' | 'totalOut' | 'currentStock'>
): Promise<SKU> {
  const id = 'SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  const { data, error } = await supabase
    .from('user_inventory')
    .insert({
      id,
      user_id: userId,
      name: sku.name,
      category: sku.category,
      unit: sku.unit,
      price: sku.price,
      opening_stock: sku.openingStock || 0,
      min_threshold: sku.minThreshold,
      status: 'OPTIMAL',
      expiry_date: sku.expiryDate,
    })
    .select()
    .single();

  if (error) {
    console.error('[inventoryService] addSku failed:', error.message);
    throw error;
  }
  return rowToSku(data);
}

/**
 * Update SKU details
 */
export async function updateSku(skuId: string, updates: Partial<SKU>): Promise<void> {
  const { error } = await supabase
    .from('user_inventory')
    .update({
      name: updates.name,
      price: updates.price,
      min_threshold: updates.minThreshold,
      expiry_date: updates.expiryDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', skuId);

  if (error) {
    console.error('[inventoryService] updateSku failed:', error.message);
    throw error;
  }
}

/**
 * Delete a SKU
 */
export async function deleteSku(skuId: string): Promise<void> {
  const { error } = await supabase
    .from('user_inventory')
    .delete()
    .eq('id', skuId);

  if (error) {
    console.error('[inventoryService] deleteSku failed:', error.message);
    throw error;
  }
}

// ─── Stock Movements ──────────────────────────────────────────────

/**
 * Record a stock IN/OUT movement
 */
export async function recordStockMovement(
  userId: string,
  skuId: string,
  type: MovementType,
  quantity: number,
  reason: string
): Promise<StockLog> {
  const id = 'LOG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  // Insert log entry
  const { error: logError } = await supabase
    .from('stock_logs')
    .insert({
      id,
      user_id: userId,
      sku_id: skuId,
      type,
      quantity,
      reason,
    });

  if (logError) {
    console.error('[inventoryService] recordStockMovement failed:', logError.message);
    throw logError;
  }

  // Update SKU current stock
  const { data: sku, error: skuFetchError } = await supabase
    .from('user_inventory')
    .select('total_in, total_out, opening_stock, current_stock')
    .eq('id', skuId)
    .single();

  if (skuFetchError) throw skuFetchError;

  const newTotalIn = type === 'IN' ? (sku.total_in || 0) + quantity : sku.total_in || 0;
  const newTotalOut = type === 'OUT' ? (sku.total_out || 0) + quantity : sku.total_out || 0;
  const newCurrentStock = (sku.opening_stock || 0) + newTotalIn - newTotalOut;

  // Determine status
  let status = 'OPTIMAL';
  const minThreshold = 5; // Get from SKU or use default
  if (newCurrentStock <= 0) status = 'CRITICAL';
  else if (newCurrentStock < minThreshold) status = 'LOW';
  else if (newCurrentStock > minThreshold * 5) status = 'EXCESS';

  await supabase
    .from('user_inventory')
    .update({
      total_in: newTotalIn,
      total_out: newTotalOut,
      current_stock: newCurrentStock,
      status,
      last_updated: new Date().toISOString(),
    })
    .eq('id', skuId);

  return {
    id,
    skuId,
    type,
    quantity,
    reason,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch movement history for a SKU
 */
export async function fetchSkuHistory(skuId: string): Promise<StockLog[]> {
  const { data, error } = await supabase
    .from('stock_logs')
    .select('*')
    .eq('sku_id', skuId)
    .order('timestamp', { ascending: false });

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
}

// ─── Real-time subscription ──────────────────────────────────────

/**
 * Subscribe to real-time inventory changes
 */
export function subscribeToInventory(
  userId: string,
  onUpdate: (inventory: SKU[]) => void
): () => void {
  const channel = supabase
    .channel('inventory-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_inventory',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        const fresh = await fetchInventory(userId);
        onUpdate(fresh);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function rowToSku(row: any): SKU {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    price: row.price,
    openingStock: row.opening_stock || 0,
    totalIn: row.total_in || 0,
    totalOut: row.total_out || 0,
    currentStock: row.current_stock || 0,
    minThreshold: row.min_threshold || 5,
    lastUpdated: row.last_updated,
    status: row.status,
    expiryDate: row.expiry_date,
  };
}
```

---

#### B. Payments Service (`src/services/paymentsService.ts`)

```typescript
import { supabase } from '../backend/supabase';
import type { Payment } from '../types';

/**
 * Fetch all payments for a user
 */
export async function fetchPayments(userId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[paymentsService] fetchPayments failed:', error.message);
    return [];
  }
  return (data ?? []).map(rowToPayment);
}

/**
 * Record a new payment
 */
export async function addPayment(
  userId: string,
  payment: Omit<Payment, 'id'>
): Promise<Payment> {
  const id = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  const { data, error } = await supabase
    .from('payments')
    .insert({
      id,
      user_id: userId,
      party: payment.party,
      amount: payment.amount,
      type: payment.type,
      method: payment.method,
      status: payment.status || 'COMPLETED',
      note: payment.note,
      date: payment.date,
      source: payment.source,
      source_id: payment.sourceId,
    })
    .select()
    .single();

  if (error) {
    console.error('[paymentsService] addPayment failed:', error.message);
    throw error;
  }
  return rowToPayment(data);
}

/**
 * Delete a payment
 */
export async function deletePayment(paymentId: string): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId);

  if (error) {
    console.error('[paymentsService] deletePayment failed:', error.message);
    throw error;
  }
}

// ─── Real-time subscription ──────────────────────────────────────

export function subscribeToPayments(
  userId: string,
  onUpdate: (payments: Payment[]) => void
): () => void {
  const channel = supabase
    .channel('payments-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        const fresh = await fetchPayments(userId);
        onUpdate(fresh);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function rowToPayment(row: any): Payment {
  return {
    id: row.id,
    party: row.party,
    amount: row.amount,
    type: row.type,
    method: row.method,
    status: row.status,
    note: row.note,
    date: row.date,
    source: row.source,
    sourceId: row.source_id,
  };
}
```

---

## 5. Using Services in App.tsx

```typescript
import { fetchInventory, subscribeToInventory, recordStockMovement } from './services/inventoryService';
import { fetchPayments, subscribeToPayments } from './services/paymentsService';

// Inside useEffect or handlers:
const handleLoadInventory = async (userId: string) => {
  try {
    const inventory = await fetchInventory(userId);
    setState(s => ({ ...s, inventory }));
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToInventory(userId, (freshInventory) => {
      setState(s => ({ ...s, inventory: freshInventory }));
    });
    
    return unsubscribe;
  } catch (err) {
    console.error('Failed to load inventory:', err);
  }
};

// Adding a new product
const handleAddProduct = async (name: string, category: string, unit: string) => {
  try {
    const newSku = await addSku(state.profile.id, {
      name,
      category,
      unit,
      price: 0,
      openingStock: 0,
      minThreshold: 5,
    });
    setState(s => ({ ...s, inventory: [...s.inventory, newSku] }));
  } catch (err) {
    console.error('Failed to add product:', err);
  }
};

// Recording stock movement
const handleStockOut = async (skuId: string, quantity: number, reason: string) => {
  try {
    await recordStockMovement(state.profile.id, skuId, 'OUT', quantity, reason);
    // Inventory will auto-update via real-time subscription
  } catch (err) {
    console.error('Failed to record stock movement:', err);
  }
};
```

---

## 6. Handling Real-Time Updates

```typescript
useEffect(() => {
  if (!state.isLoggedIn || !state.profile.id) return;

  // Subscribe to multiple real-time channels
  const unsubscribeInventory = subscribeToInventory(state.profile.id, (inventory) => {
    setState(s => ({ ...s, inventory }));
  });

  const unsubscribeExpenses = subscribeToExpenses(state.profile.id, (expenses) => {
    setState(s => ({ ...s, expenses }));
  });

  const unsubscribePayments = subscribeToPayments(state.profile.id, (payments) => {
    setState(s => ({ ...s, payments }));
  });

  return () => {
    unsubscribeInventory();
    unsubscribeExpenses();
    unsubscribePayments();
  };
}, [state.isLoggedIn, state.profile.id]);
```

---

## 7. File Upload to Supabase Storage

```typescript
/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-avatar.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('user-uploads')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('user-uploads')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Upload product image
 */
export async function uploadProductImage(
  userId: string,
  skuId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${skuId}-product.${fileExt}`;
  const filePath = `products/${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
```

---

## 8. Error Handling Best Practices

```typescript
/**
 * Wrapper for safe async operations
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    console.error(`[${context}]`, error.message);
    return fallback;
  }
}

// Usage
const inventory = await safeAsyncOperation(
  () => fetchInventory(userId),
  [],
  'inventoryService'
);
```

---

## 9. Quick Testing Checklist

- [ ] Create a test user via email/OTP
- [ ] Add a product to inventory
- [ ] Record stock IN/OUT
- [ ] Create an expense
- [ ] Record a payment
- [ ] Test real-time updates (open in 2 tabs)
- [ ] Verify geolocation & nearby stores
- [ ] Test business connections
- [ ] Check error handling with network off

---

## 10. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Missing SUPABASE_URL` | Ensure `.env` file exists in root with correct values |
| `401 Unauthorized` | Check SUPABASE_ANON_KEY is correct in `.env` |
| `RLS policy denied` | User trying to access other user's data. Check RLS policies. |
| `Real-time not working` | Ensure table has RLS enabled but allows `auth.uid()` access |
| `Storage upload fails` | Create `user-uploads` and `product-images` buckets in Storage tab |

---

## 11. Performance Tips

```typescript
// ✅ GOOD: Batch fetch
const inventories = await Promise.all(
  userIds.map(id => fetchInventory(id))
);

// ❌ BAD: Loop of individual queries
for (const userId of userIds) {
  await fetchInventory(userId); // N queries
}

// ✅ GOOD: Use .select() to limit columns
.select('id, name, category, current_stock')

// ❌ BAD: Fetch all columns if not needed
.select('*')

// ✅ GOOD: Use filters before pagination
.eq('user_id', userId)
.order('created_at', { ascending: false })
.limit(10)
```

---

That's it! You now have a complete Supabase implementation roadmap.
