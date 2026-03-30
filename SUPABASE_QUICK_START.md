# Quick Implementation Guide - Using Supabase Services in App.tsx

## Import Services

```typescript
// At the top of App.tsx
import { 
  fetchInventory, 
  addSku, 
  recordStockMovement, 
  subscribeToInventory,
  calculateHealthScore,
  calculateTotalInventoryValue 
} from './services/inventoryService';

import {
  fetchPayments,
  addPayment,
  subscribeToPayments,
  calculateNetCashFlow
} from './services/paymentsService';

import {
  calculateDashboardKPIs,
  calculateSalesMetrics,
  analyzeInventory,
  fetchAnalyticsSummary
} from './services/analyticsService';

import {
  fetchExpenses,
  addExpense,
  subscribeToExpenses
} from './services/expensesService';
```

---

## Pattern 1: Load Data on Login

```typescript
// When user logs in successfully
const handleAuthSuccess = useCallback((method: string, data?: any) => {
  setState(s => ({
    ...s,
    isLoggedIn: true,
    profile: { ...s.profile, id: data?.id },
  }));

  // Load all data
  loadUserData(data?.id);
}, []);

const loadUserData = async (userId: string) => {
  try {
    // Load inventory
    const inventory = await fetchInventory(userId);
    
    // Load payments
    const payments = await fetchPayments(userId);
    
    // Load expenses
    const expenses = await fetchExpenses(userId);
    
    // Update state
    setState(s => ({
      ...s,
      inventory,
      payments,
      expenses,
    }));
    
    // Subscribe to real-time updates
    setupRealtimeSubscriptions(userId);
  } catch (err) {
    console.error('Failed to load user data:', err);
  }
};
```

---

## Pattern 2: Real-time Subscriptions

```typescript
const setupRealtimeSubscriptions = (userId: string) => {
  // Subscribe to inventory changes
  const unsubscribeInventory = subscribeToInventory(userId, (freshInventory) => {
    setState(s => ({ ...s, inventory: freshInventory }));
  });

  // Subscribe to payment changes
  const unsubscribePayments = subscribeToPayments(userId, (freshPayments) => {
    setState(s => ({ ...s, payments: freshPayments }));
  });

  // Subscribe to expense changes
  const unsubscribeExpenses = subscribeToExpenses(userId, (freshExpenses) => {
    setState(s => ({ ...s, expenses: freshExpenses }));
  });

  // Store unsubscribers for cleanup
  return [unsubscribeInventory, unsubscribePayments, unsubscribeExpenses];
};

// In useEffect cleanup:
useEffect(() => {
  if (!state.isLoggedIn) return;
  
  const unsubscribers = setupRealtimeSubscriptions(state.profile.id);
  
  return () => {
    unsubscribers.forEach(unsub => unsub?.());
  };
}, [state.isLoggedIn, state.profile.id]);
```

---

## Pattern 3: Add New SKU (Product)

```typescript
const handleAddProduct = async (name: string, category: string, unit: string, price: number) => {
  try {
    const newSku = await addSku(state.profile.id, {
      name,
      category,
      unit,
      price,
      openingStock: 0,
      minThreshold: 5,
    });
    
    // UI will auto-update via real-time subscription
    // But you can manually update too:
    setState(s => ({ 
      ...s, 
      inventory: [...s.inventory, newSku] 
    }));
    
    showToast(`✅ Product "${name}" added to inventory!`);
  } catch (err: any) {
    showToast(`❌ Failed to add product: ${err.message}`);
  }
};
```

---

## Pattern 4: Record Stock Movement

```typescript
const handleStockOut = async (skuId: string, quantity: number, reason: string) => {
  try {
    await recordStockMovement(
      state.profile.id,
      skuId,
      'OUT',
      quantity,
      reason,
      0 // optional price
    );
    
    showToast(`✅ Recorded ${quantity} units out for reason: ${reason}`);
    
    // Real-time subscription will update inventory automatically
  } catch (err: any) {
    showToast(`❌ Failed to record movement: ${err.message}`);
  }
};

const handleStockIn = async (skuId: string, quantity: number) => {
  try {
    await recordStockMovement(
      state.profile.id,
      skuId,
      'IN',
      quantity,
      'Stock purchase',
      0
    );
    
    showToast(`✅ Added ${quantity} units to stock`);
  } catch (err: any) {
    showToast(`❌ Failed: ${err.message}`);
  }
};
```

---

## Pattern 5: Add Payment Record

```typescript
const handleRecordPayment = async (
  party: string,
  amount: number,
  type: 'RECEIVED' | 'PAID',
  method: 'CASH' | 'UPI' | 'CARD' | 'BANK'
) => {
  try {
    const payment = await addPayment(state.profile.id, {
      party,
      amount,
      type,
      method,
      status: 'COMPLETED',
      date: new Date().toISOString().split('T')[0],
    });
    
    setState(s => ({
      ...s,
      payments: [payment, ...s.payments],
    }));
    
    showToast(`✅ Payment recorded: ₹${amount} ${type}`);
  } catch (err: any) {
    showToast(`❌ Failed: ${err.message}`);
  }
};
```

---

## Pattern 6: Calculate Dashboard KPIs

```typescript
// In render / useMemo for efficient recomputation
const dashboardKPIs = useMemo(() => {
  return calculateDashboardKPIs(state.inventory, state.expenses, state.payments);
}, [state.inventory, state.expenses, state.payments]);

// Use in JSX
<div className="kpi-grid">
  <KpiCard 
    title="Total Items" 
    value={dashboardKPIs.totalItems} 
    icon={Package}
  />
  <KpiCard 
    title="Critical Stock" 
    value={dashboardKPIs.criticalItems} 
    icon={AlertTriangle} 
    color="red"
  />
  <KpiCard 
    title="Inventory Value" 
    value={`₹${dashboardKPIs.inventoryValue.toFixed(0)}`} 
    icon={TrendingUp}
  />
  <KpiCard 
    title="Health Score" 
    value={`${dashboardKPIs.inventoryHealthScore}/100`} 
    icon={Zap}
  />
</div>
```

---

## Pattern 7: Sales Analysis

```typescript
const performSalesAnalysis = async () => {
  try {
    // Fetch all analytics data
    const data = await fetchAnalyticsSummary(state.profile.id);
    
    // Convert rows to typed objects
    const inventory = data.inventory.map(rowToSku);
    const movements = data.movements.map(rowToStockLog);
    
    // Calculate metrics
    const metrics = calculateSalesMetrics(inventory, movements, data.expenses);
    
    setState(s => ({ 
      ...s, 
      salesMetrics: metrics 
    }));
    
    console.log('📊 Sales Analysis:', metrics);
    // Output example:
    // {
    //   totalRevenue: 45000,
    //   totalCost: 12000,
    //   grossProfit: 33000,
    //   profitMargin: 73.3,
    //   topSellingItem: 'Rice 10kg',
    //   ...
    // }
  } catch (err) {
    console.error('Analysis failed:', err);
  }
};
```

---

## Pattern 8: Inventory Analysis

```typescript
const performInventoryAnalysis = () => {
  const analysis = analyzeInventory(state.inventory, state.movementLogs);
  
  setState(s => ({ ...s, inventoryAnalysis: analysis }));
  
  // Show alerts
  if (analysis.understock.length > 0) {
    showAlert(
      `⚠️ ${analysis.understock.length} items are low on stock!`,
      'warning'
    );
  }
  
  if (analysis.expiringItems.length > 0) {
    showAlert(
      `📦 ${analysis.expiringItems.length} items expiring soon!`,
      'info'
    );
  }
  
  console.log('📈 Inventory Analysis:', {
    overstock: analysis.overstock.length,
    understock: analysis.understock.length,
    turnoverRatio: analysis.turnoverRatio.toFixed(2),
  });
};
```

---

## Pattern 9: Error Handling Wrapper

```typescript
const withErrorHandling = async (
  operation: () => Promise<any>,
  successMessage: string,
  errorContext: string
) => {
  try {
    const result = await operation();
    showToast(`✅ ${successMessage}`);
    return result;
  } catch (err: any) {
    console.error(`[${errorContext}]`, err);
    showToast(`❌ ${errorContext}: ${err.message}`);
    return null;
  }
};

// Usage
const result = await withErrorHandling(
  () => addSku(userId, skuData),
  'Product added successfully!',
  'addSku'
);
```

---

## Pattern 10: Form Submission Example

```typescript
const handleAddInventoryItem = async (formData: {
  name: string;
  category: string;
  unit: string;
  price: number;
  minThreshold: number;
  expiryDate?: string;
}) => {
  setLoading(true);
  try {
    const newSku = await addSku(state.profile.id, {
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      price: formData.price,
      openingStock: 0,
      minThreshold: formData.minThreshold,
      expiryDate: formData.expiryDate,
    });

    setState(s => ({
      ...s,
      inventory: [...s.inventory, newSku],
    }));

    // Clear form
    setFormData({ name: '', category: '', unit: '', price: 0 });
    
    showToast(`✅ "${formData.name}" added!`);
  } catch (err: any) {
    showToast(`❌ Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
```

---

## Complete useEffect Setup Example

```typescript
useEffect(() => {
  // Only run when user logs in
  if (!state.isLoggedIn || !state.profile.id) return;

  let isMounted = true;
  const unsubscribers: (() => void)[] = [];

  const initializeUserData = async () => {
    try {
      // Load all data in parallel
      const [inventory, payments, expenses] = await Promise.all([
        fetchInventory(state.profile.id),
        fetchPayments(state.profile.id),
        fetchExpenses(state.profile.id),
      ]);

      if (!isMounted) return;

      setState(s => ({
        ...s,
        inventory,
        payments,
        expenses,
      }));

      // Subscribe to real-time updates
      if (isMounted) {
        unsubscribers.push(
          subscribeToInventory(state.profile.id, (inv) => {
            setState(s => ({ ...s, inventory: inv }));
          }),
          subscribeToPayments(state.profile.id, (pay) => {
            setState(s => ({ ...s, payments: pay }));
          }),
          subscribeToExpenses(state.profile.id, (exp) => {
            setState(s => ({ ...s, expenses: exp }));
          })
        );
      }
    } catch (err) {
      console.error('Failed to initialize:', err);
    }
  };

  initializeUserData();

  // Cleanup
  return () => {
    isMounted = false;
    unsubscribers.forEach(unsub => unsub?.());
  };
}, [state.isLoggedIn, state.profile.id]);
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `undefined is not an object (evaluating 'data.map')` | Check if data is null/undefined. Use `(data ?? []).map(...)` |
| `Real-time not working` | Ensure user has RLS permissions. Check Supabase Dashboard → Authentication → Row Level Security |
| `Slow queries` | Use `.limit()` and index frequently queried columns |
| `CORS errors` | Check SUPABASE_URL and SUPABASE_ANON_KEY are correct |
| `Stale data` | Always use real-time subscriptions, not just initial fetch |

---

## Next Steps

1. ✅ Set up database schema (SUPABASE_SETUP.md)
2. ✅ Create services (inventoryService, paymentsService, analyticsService)
3. **👉 Integrate into App.tsx using patterns above**
4. Test all CRUD operations
5. Refactor monolithic App.tsx into smaller components
6. Add error boundaries and loading states
7. Implement caching for offline mode

---

All services are **production-ready**. Use these patterns throughout your app!
