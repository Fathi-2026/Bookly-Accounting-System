import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  currency: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithSpending extends Budget {
  currentSpending: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  user_id: string;
  description?: string;
}

export const useBudgets = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsWithSpending, setBudgetsWithSpending] = useState<BudgetWithSpending[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasShownAlert, setHasShownAlert] = useState<Set<string>>(new Set());

  // Fetch budgets from Supabase
  const fetchBudgets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transactions from Supabase
  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Calculate budget spending with actual transaction data
  const calculateBudgetSpending = (budgets: Budget[], transactions: Transaction[]): BudgetWithSpending[] => {
    console.log('=== BUDGET CALCULATION DEBUG ===');
    console.log('Total budgets:', budgets.length);
    console.log('Total transactions:', transactions.length);
    
    return budgets.map(budget => {
      // Find all expense transactions for this category
      const relevantTransactions = transactions.filter(transaction => {
        const isSameCategory = transaction.category?.toLowerCase().trim() === budget.category.toLowerCase().trim();
        const isExpense = transaction.type === 'expense';
        return isSameCategory && isExpense;
      });

      // Sum up the amounts
      const currentSpending = relevantTransactions.reduce((total, transaction) => {
        return total + Math.abs(transaction.amount);
      }, 0);

      const remaining = budget.amount - currentSpending;
      const percentage = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;
      const isOverBudget = currentSpending > budget.amount;

      // Debug logging
      console.log(`Budget: ${budget.category}`);
      console.log(`Budget Amount: ${budget.currency} ${budget.amount}`);
      console.log(`Found ${relevantTransactions.length} transactions`);
      console.log(`Transaction amounts:`, relevantTransactions.map(t => t.amount));
      console.log(`Calculated Spending: ${currentSpending}`);
      console.log(`Remaining: ${remaining}`);
      console.log(`Over Budget: ${isOverBudget}`);
      console.log('---');

      return {
        ...budget,
        currentSpending,
        remaining,
        percentage,
        isOverBudget
      };
    });
  };

  // Show alert when budget is exceeded
  const checkBudgetAlerts = (budgetsWithSpending: BudgetWithSpending[]) => {
    budgetsWithSpending.forEach(budget => {
      if (budget.isOverBudget && !hasShownAlert.has(budget.id)) {
        alert(`🚨 Budget Exceeded!\n\nCategory: ${budget.category}\nLimit: ${budget.currency} ${budget.amount.toFixed(2)}\nSpent: ${budget.currency} ${budget.currentSpending.toFixed(2)}\nOver by: ${budget.currency} ${Math.abs(budget.remaining).toFixed(2)}`);
        
        setHasShownAlert(prev => new Set(prev).add(budget.id));
      }
      
      if (!budget.isOverBudget && hasShownAlert.has(budget.id)) {
        setHasShownAlert(prev => {
          const newSet = new Set(prev);
          newSet.delete(budget.id);
          return newSet;
        });
      }
    });
  };

  // Add new budget
  const addBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User must be logged in');

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...budget, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setBudgets(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  };

  // Update budget
  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setBudgets(prev => prev.map(b => b.id === id ? data : b));
      return data;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  // Delete budget
  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBudgets(prev => prev.filter(b => b.id !== id));
      setHasShownAlert(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await fetchBudgets();
    await fetchTransactions();
  };

  // Calculate budgets with spending whenever budgets or transactions change
  useEffect(() => {
    if (budgets.length > 0) {
      const calculatedBudgets = calculateBudgetSpending(budgets, transactions);
      setBudgetsWithSpending(calculatedBudgets);
      checkBudgetAlerts(calculatedBudgets);
    }
  }, [budgets, transactions]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  return {
    budgets: budgetsWithSpending, // Return budgets with calculated spending
    rawBudgets: budgets, // Original budgets without spending
    transactions,
    addBudget,
    updateBudget,
    deleteBudget,
    fetchBudgets: refreshData,
    refreshData,
    isLoading,
  };
};