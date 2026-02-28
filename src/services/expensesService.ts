import { supabase } from './supabaseClient';
import type { Expense } from '../types';

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Fetch all expenses for a given user, ordered newest-first.
 */
export async function fetchExpenses(userId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[expensesService] fetchExpenses failed:', error.message);
    return [];
  }
  return (data ?? []).map(rowToExpense);
}

/**
 * Insert a new expense row and return it.
 */
export async function addExpense(
  userId: string,
  expense: Omit<Expense, 'id'>
): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
    })
    .select()
    .single();

  if (error) {
    console.error('[expensesService] addExpense failed:', error.message);
    throw error;
  }
  return rowToExpense(data);
}

/**
 * Delete an expense by id.
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  if (error) {
    console.error('[expensesService] deleteExpense failed:', error.message);
    throw error;
  }
}

// ─── Real-time ───────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time changes on the expenses table for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToExpenses(
  userId: string,
  onUpdate: (expenses: Expense[]) => void
): () => void {
  const channel = supabase
    .channel('expenses-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        const fresh = await fetchExpenses(userId);
        onUpdate(fresh);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToExpense(row: any): Expense {
  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    description: row.description || '',
    date: row.date,
  };
}
