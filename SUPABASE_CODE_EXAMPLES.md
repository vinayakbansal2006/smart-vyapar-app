# Real Examples - Copy & Paste Code for App.tsx

These are production-ready code snippets you can directly copy into your App.tsx

---

## Example 1: Initialize User Data on Login

```typescript
// ✨ Call this when user successfully logs in

const initializeUserDataOnLogin = async (userId: string) => {
  try {
    console.log('[App] Initializing user data for:', userId);
    
    // Fetch all data in parallel for speed
    const [inventory, payments, expenses] = await Promise.all([
      fetchInventory(userId),
      fetchPayments(userId),
      fetchExpenses(userId),
    ]);

    // Update app state
    setState(s => ({
      ...s,
      isLoggedIn: true,
      profile: { ...s.profile, id: userId },
      inventory: inventory || [],
      payments: payments || [],
      expenses: expenses || [],
    }));

    // Set up real-time listeners
    setupRealTimeListeners(userId);
    
    console.log('[App] ✅ User data loaded:', {
      items: inventory?.length || 0,
      payments: payments?.length || 0,
      expenses: expenses?.length || 0,
    });
  } catch (error) {
    console.error('[App] Failed to initialize user data:', error);
    showToast('❌ Failed to load your data. Please refresh.', 'error');
  }
};

const setupRealTimeListeners = (userId: string) => {
  const unsubscribers: (() => void)[] = [];

  // Listen for inventory changes
  unsubscribers.push(
    subscribeToInventory(userId, (freshInventory) => {
      setState(s => ({ ...s, inventory: freshInventory }));
      console.log('[App] 📦 Inventory updated');
    })
  );

  // Listen for payment changes
  unsubscribers.push(
    subscribeToPayments(userId, (freshPayments) => {
      setState(s => ({ ...s, payments: freshPayments }));
      console.log('[App] 💰 Payments updated');
    })
  );

  // Listen for expense changes
  unsubscribers.push(
    subscribeToExpenses(userId, (freshExpenses) => {
      setState(s => ({ ...s, expenses: freshExpenses }));
      console.log('[App] 💸 Expenses updated');
    })
  );

  // Store for cleanup on logout
  setState(s => ({ ...s, realtimeUnsubscribers: unsubscribers }));
};
```

---

## Example 2: Add Product Form Handler

```typescript
const handleAddProductSubmit = async (formData: {
  name: string;
  category: string;
  unit: string;
  price: number;
  minThreshold: number;
  expiryDate?: string;
}) => {
  setLoadingState('addingProduct');
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

    // Update state (though real-time subscription will do this too)
    setState(s => ({
      ...s,
      inventory: [...s.inventory, newSku],
    }));

    // Clear form
    setProductFormData({
      name: '',
      category: 'GROCERY',
      unit: 'KG',
      price: 0,
      minThreshold: 5,
    });

    showToast(`✅ "${formData.name}" added to inventory!`, 'success');
    setShowProductForm(false); // Close modal
  } catch (error: any) {
    console.error('[App] Failed to add product:', error);
    showToast(`❌ Error: ${error.message}`, 'error');
  } finally {
    setLoadingState(null);
  }
};
```

---

## Example 3: Stock In/Out Buttons

```typescript
const handleRecordStockMovement = async (
  skuId: string,
  direction: 'IN' | 'OUT',
  quantity: number,
  reason: string = ''
) => {
  setLoadingState(`stock${direction}`);
  try {
    await recordStockMovement(
      state.profile.id,
      skuId,
      direction,
      quantity,
      reason || (direction === 'IN' ? 'Stock replenishment' : 'Sale')
    );

    const verb = direction === 'IN' ? 'Added' : 'Removed';
    showToast(
      `✅ ${verb} ${quantity} units. ${reason ? `Reason: ${reason}` : ''}`,
      'success'
    );
  } catch (error: any) {
    console.error('[App] Stock movement failed:', error);
    showToast(`❌ Failed: ${error.message}`, 'error');
  } finally {
    setLoadingState(null);
  }
};

// Usage in JSX:
<button onClick={() => handleRecordStockMovement(sku.id, 'IN', 10)}>
  ➕ Stock In
</button>

<button onClick={() => handleRecordStockMovement(sku.id, 'OUT', 5, 'Customer sale')}>
  ➖ Stock Out
</button>
```

---

## Example 4: Record Payment

```typescript
const handleRecordPayment = async (paymentData: {
  party: string;
  amount: number;
  type: 'RECEIVED' | 'PAID';
  method: 'CASH' | 'UPI' | 'CARD' | 'BANK';
  note?: string;
}) => {
  setLoadingState('recordingPayment');
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const payment = await addPayment(state.profile.id, {
      party: paymentData.party,
      amount: paymentData.amount,
      type: paymentData.type,
      method: paymentData.method,
      status: 'COMPLETED',
      date: today,
      note: paymentData.note,
    });

    // Update state
    setState(s => ({
      ...s,
      payments: [payment, ...s.payments],
    }));

    const actionLabel = paymentData.type === 'RECEIVED' ? '💰 Received' : '💸 Paid';
    showToast(
      `✅ ${actionLabel} ₹${paymentData.amount} from/to ${paymentData.party}`,
      'success'
    );

    // Reset form
    setPaymentFormData({
      party: '',
      amount: 0,
      type: 'PAID',
      method: 'CASH',
      note: '',
    });
  } catch (error: any) {
    console.error('[App] Payment recording failed:', error);
    showToast(`❌ Failed: ${error.message}`, 'error');
  } finally {
    setLoadingState(null);
  }
};
```

---

## Example 5: Dashboard KPI Cards

```typescript
const DashboardKPISection: React.FC = () => {
  // Calculate KPIs whenever inventory/payments change
  const kpis = useMemo(() => {
    return calculateDashboardKPIs(state.inventory, state.expenses, state.payments);
  }, [state.inventory, state.expenses, state.payments]);

  // Calculate sales metrics
  const metrics = useMemo(() => {
    return calculateSalesMetrics(
      state.inventory,
      state.movementLogs,
      state.expenses
    );
  }, [state.inventory, state.movementLogs, state.expenses]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Items */}
      <KpiCard
        title="Items in Stock"
        value={kpis.totalItems}
        icon={Package}
        color="indigo"
        subtitle={`${kpis.lowStockItems} low, ${kpis.criticalItems} critical`}
      />

      {/* Inventory Value */}
      <KpiCard
        title="Inventory Value"
        value={`₹${(kpis.inventoryValue / 1000).toFixed(1)}K`}
        icon={TrendingUp}
        color="emerald"
        subtitle={`Total stock worth`}
      />

      {/* Health Score */}
      <KpiCard
        title="Health Score"
        value={`${kpis.inventoryHealthScore}%`}
        icon={Zap}
        color={kpis.inventoryHealthScore > 70 ? 'green' : 'amber'}
        subtitle={`Inventory status`}
      />

      {/* Cash Flow */}
      <KpiCard
        title="Net Cash Flow"
        value={`₹${(kpis.netCashFlow / 1000).toFixed(1)}K`}
        icon={CreditCard}
        color={kpis.netCashFlow > 0 ? 'emerald' : 'rose'}
        subtitle={`Received - Paid`}
      />

      {/* Profit Margin */}
      <KpiCard
        title="Profit Margin"
        value={`${metrics.profitMargin.toFixed(1)}%`}
        icon={BarChart3}
        color="violet"
        subtitle={`₹${(metrics.grossProfit / 1000).toFixed(1)}K profit`}
      />

      {/* Top Item */}
      <KpiCard
        title="Top Selling"
        value={metrics.topSellingItem || 'N/A'}
        icon={Star}
        color="amber"
        subtitle={`Most sold item`}
      />

      {/* Expiring Soon */}
      <KpiCard
        title="Expiring Items"
        value={kpis.expiringItems}
        icon={AlertTriangle}
        color={kpis.expiringItems > 0 ? 'rose' : 'gray'}
        subtitle={`Next 30 days`}
      />

      {/* Total Revenue */}
      <KpiCard
        title="Total Revenue"
        value={`₹${(metrics.totalRevenue / 1000).toFixed(1)}K`}
        icon={TrendingUp}
        color="cyan"
        subtitle={`All-time sales`}
      />
    </div>
  );
};
```

---

## Example 6: Inventory Analysis Alert

```typescript
const showInventoryAlerts = () => {
  const analysis = analyzeInventory(state.inventory, state.movementLogs);

  // Alert: Critical items
  if (analysis.understock.length > 0) {
    const items = analysis.understock
      .slice(0, 3)
      .map(s => `• ${s.name}`)
      .join('\n');
    
    showAlert({
      type: 'error',
      title: `⚠️ ${analysis.understock.length} items low on stock!`,
      message: items,
      action: () => {
        // Navigate to inventory section
        setCurrentView('inventory');
      },
    });
  }

  // Alert: Expiring items
  if (analysis.expiringItems.length > 0) {
    const items = analysis.expiringItems
      .slice(0, 3)
      .map(s => `• ${s.name} (expires ${s.expiryDate})`)
      .join('\n');
    
    showAlert({
      type: 'warning',
      title: `📦 ${analysis.expiringItems.length} items expiring soon!`,
      message: items,
    });
  }

  // Alert: Overstock
  if (analysis.overstock.length > 0) {
    console.log(
      `💡 Tip: ${analysis.overstock.length} items are overstocked. Consider discounts.`
    );
  }

  console.log('📊 Inventory Analysis:', {
    understock: analysis.understock.length,
    fastMoving: analysis.fastMoving.length,
    slowMoving: analysis.slowMoving.length,
    overstock: analysis.overstock.length,
    turnoverRatio: analysis.turnoverRatio.toFixed(2),
  });
};

// Call on app load:
useEffect(() => {
  if (state.isLoggedIn && state.inventory.length > 0) {
    showInventoryAlerts();
  }
}, [state.isLoggedIn, state.inventory]);
```

---

## Example 7: Logout Cleanup

```typescript
const handleLogout = async () => {
  try {
    // Show loading
    setLoadingState('loggingOut');

    // Unsubscribe from all real-time listeners
    state.realtimeUnsubscribers?.forEach(unsub => unsub?.());

    // Sign out from Supabase
    await signOut();

    // Clear state
    const freshProfile: UserProfile = {
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      name: '',
      phone: '',
      email: '',
      shopName: '',
      city: '',
      state: '',
      businessCategory: '',
      establishedYear: '',
      gstin: '',
      address: '',
      bioAuthEnabled: false,
      notificationsEnabled: true,
    };

    setState({
      isLoggedIn: false,
      inventory: [],
      payments: [],
      expenses: [],
      movementLogs: [],
      profile: freshProfile,
      realtimeUnsubscribers: [],
      // ... reset all other state
    });

    showToast('✅ Logged out successfully', 'success');
  } catch (error: any) {
    console.error('[App] Logout failed:', error);
    showToast(`❌ Logout error: ${error.message}`, 'error');
  } finally {
    setLoadingState(null);
  }
};
```

---

## Example 8: Show Low Stock Report

```typescript
const viewLowStockReport = () => {
  const analysis = analyzeInventory(state.inventory, state.movementLogs);
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        ⚠️ Low Stock Items ({analysis.understock.length})
      </h2>

      {analysis.understock.length === 0 ? (
        <p className="text-green-600">✅ All items are well stocked!</p>
      ) : (
        <div className="space-y-2">
          {analysis.understock.map(sku => (
            <div
              key={sku.id}
              className="flex justify-between items-center p-3 border-l-4 border-rose-500 bg-rose-50"
            >
              <div>
                <p className="font-bold">{sku.name}</p>
                <p className="text-sm text-gray-600">
                  Current: {sku.currentStock} | Min: {sku.minThreshold}
                </p>
              </div>
              <button
                onClick={() => handleRecordStockMovement(sku.id, 'IN', 10)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ➕ Reorder
              </button>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-xl font-bold mt-6 mb-4">
        🚀 Fast Moving Items ({analysis.fastMoving.length})
      </h3>
      <p className="text-sm text-gray-600">
        High demand, low stock. Keep these always in supply!
      </p>
      <div className="mt-2">
        {analysis.fastMoving.map(sku => (
          <p key={sku.id} className="text-green-700 font-semibold">
            ✓ {sku.name} ({sku.currentStock}/{sku.minThreshold})
          </p>
        ))}
      </div>
    </div>
  );
};
```

---

## Example 9: Sales Dashboard

```typescript
const showSalesDashboard = () => {
  const metrics = useMemo(() => {
    return calculateSalesMetrics(
      state.inventory,
      state.movementLogs,
      state.expenses
    );
  }, [state.inventory, state.movementLogs, state.expenses]);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">📊 Sales & Profit</h2>

      <div className="grid grid-cols-2 gap-4">
        <MetricBox
          label="Total Revenue"
          value={`₹${metrics.totalRevenue.toFixed(2)}`}
          color="emerald"
        />
        <MetricBox
          label="Total Cost"
          value={`₹${metrics.totalCost.toFixed(2)}`}
          color="rose"
        />
        <MetricBox
          label="Gross Profit"
          value={`₹${metrics.grossProfit.toFixed(2)}`}
          color="violet"
        />
        <MetricBox
          label="Profit Margin"
          value={`${metrics.profitMargin.toFixed(1)}%`}
          color={metrics.profitMargin > 30 ? 'green' : 'amber'}
        />
      </div>

      <div className="mt-6 p-4 bg-slate-100 rounded">
        <p className="text-sm text-slate-700">
          <strong>Top Seller:</strong> {metrics.topSellingItem}
        </p>
        <p className="text-sm text-slate-700">
          <strong>Top Category:</strong> {metrics.topSellingCategory}
        </p>
        <p className="text-sm text-slate-700">
          <strong>Avg Order Value:</strong> ₹{metrics.averageOrderValue.toFixed(2)}
        </p>
      </div>
    </div>
  );
};
```

---

## Example 10: Error Boundary Wrapper

```typescript
const safeAsyncOperation = async <T,>(
  operation: () => Promise<T>,
  fallback: T,
  context: string,
  showErrorToast: boolean = true
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    console.error(`[${context}] ${errorMsg}`);
    
    if (showErrorToast) {
      showToast(`❌ ${context}: ${errorMsg}`, 'error');
    }
    
    return fallback;
  }
};

// Usage:
const inventory = await safeAsyncOperation(
  () => fetchInventory(userId),
  [], // fallback
  'fetchInventory'
);

const payments = await safeAsyncOperation(
  () => fetchPayments(userId),
  [],
  'fetchPayments'
);
```

---

## Copy-Paste These Patterns!

All examples above are **production-ready** and handle:
- ✅ Error handling
- ✅ Loading states
- ✅ Real-time updates
- ✅ User feedback (toasts)
- ✅ Type safety

Just copy into App.tsx and adapt as needed!
