/**
 * Payments Service
 * ────────────────
 * Manages payment records (sent/received) with various methods.
 * Persisted to Supabase `payments` table.
 */

import { supabase } from '../backend/supabase';
import type { Payment } from '../types';

// ─── Payments CRUD ───────────────────────────────────────────────

/**
 * Fetch all payments for a user, ordered by most recent date
 */
export async function fetchPayments(userId: string): Promise<Payment[]> {
  try {
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
  } catch (err) {
    console.error('[paymentsService] fetchPayments exception:', err);
    return [];
  }
}

/**
 * Fetch RECEIVED payments (income)
 */
export async function fetchReceivedPayments(userId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'RECEIVED')
      .order('date', { ascending: false });

    if (error) {
      console.error('[paymentsService] fetchReceivedPayments failed:', error.message);
      return [];
    }
    return (data ?? []).map(rowToPayment);
  } catch (err) {
    console.error('[paymentsService] fetchReceivedPayments exception:', err);
    return [];
  }
}

/**
 * Fetch PAID payments (expenses)
 */
export async function fetchPaidPayments(userId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'PAID')
      .order('date', { ascending: false });

    if (error) {
      console.error('[paymentsService] fetchPaidPayments failed:', error.message);
      return [];
    }
    return (data ?? []).map(rowToPayment);
  } catch (err) {
    console.error('[paymentsService] fetchPaidPayments exception:', err);
    return [];
  }
}

/**
 * Record a new payment (received or paid)
 */
export async function addPayment(
  userId: string,
  payment: Omit<Payment, 'id'>
): Promise<Payment> {
  const id = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  try {
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
        note: payment.note || null,
        date: payment.date,
        source: payment.source || null,
        source_id: payment.sourceId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[paymentsService] addPayment failed:', error.message);
      throw error;
    }
    return rowToPayment(data);
  } catch (err) {
    console.error('[paymentsService] addPayment exception:', err);
    throw err;
  }
}

/**
 * Update payment status (e.g., PENDING → COMPLETED)
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: 'COMPLETED' | 'PENDING'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId);

    if (error) {
      console.error('[paymentsService] updatePaymentStatus failed:', error.message);
      throw error;
    }
  } catch (err) {
    console.error('[paymentsService] updatePaymentStatus exception:', err);
    throw err;
  }
}

/**
 * Delete a payment record
 */
export async function deletePayment(paymentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('[paymentsService] deletePayment failed:', error.message);
      throw error;
    }
  } catch (err) {
    console.error('[paymentsService] deletePayment exception:', err);
    throw err;
  }
}

// ─── Aggregations ───────────────────────────────────────────────

/**
 * Calculate total received amount for a period
 */
export function calculateTotalReceived(payments: Payment[]): number {
  return payments
    .filter(p => p.type === 'RECEIVED' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Calculate total paid amount for a period
 */
export function calculateTotalPaid(payments: Payment[]): number {
  return payments
    .filter(p => p.type === 'PAID' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Calculate net cash flow (received - paid)
 */
export function calculateNetCashFlow(payments: Payment[]): number {
  const received = calculateTotalReceived(payments);
  const paid = calculateTotalPaid(payments);
  return received - paid;
}

/**
 * Get payment breakdown by method
 */
export function getPaymentsByMethod(payments: Payment[]): Record<string, number> {
  const breakdown: Record<string, number> = {
    CASH: 0,
    UPI: 0,
    CARD: 0,
    BANK: 0,
  };

  payments.forEach(p => {
    if (p.status === 'COMPLETED') {
      breakdown[p.method] = (breakdown[p.method] || 0) + p.amount;
    }
  });

  return breakdown;
}

/**
 * Get payments for a specific date range
 */
export async function fetchPaymentsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error('[paymentsService] fetchPaymentsByDateRange failed:', error.message);
      return [];
    }
    return (data ?? []).map(rowToPayment);
  } catch (err) {
    console.error('[paymentsService] fetchPaymentsByDateRange exception:', err);
    return [];
  }
}

// ─── Real-time subscription ──────────────────────────────────────

/**
 * Subscribe to real-time payment changes
 * Returns an unsubscribe function.
 */
export function subscribeToPayments(
  userId: string,
  onUpdate: (payments: Payment[]) => void
): () => void {
  const channel = supabase
    .channel(`payments-${userId}-realtime`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        console.log('[paymentsService] Real-time update received');
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

/**
 * Convert database row to Payment object
 */
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

/**
 * Format payment for display
 */
export function formatPaymentForDisplay(payment: Payment): string {
  const typeLabel = payment.type === 'RECEIVED' ? '←' : '→';
  const statusLabel = payment.status === 'COMPLETED' ? '✓' : '⏳';
  return `${typeLabel} ${payment.party}: ₹${payment.amount.toFixed(2)} (${payment.method}) ${statusLabel}`;
}
