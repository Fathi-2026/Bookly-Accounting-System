import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
  description?: string;
  user_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: "income" | "expense" | "both";
  user_id?: string;
}

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    if (!user) return;

    try {
      console.log('Fetching categories for user:', user.id);
      
      const { data: userCategories, error: userError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type');

      console.log('Raw categories from DB:', userCategories);

      if (userError) {
        console.error('Database error:', userError);
        throw userError;
      }

      if (userCategories && userCategories.length > 0) {
        console.log('Setting categories:', userCategories);
        setCategories(userCategories);
      } else {
        console.log('No categories found in database');
        // Create default categories if none exist
        const defaultCategories = [
          { name: "Salary", color: "bg-green-500", type: "income" },
          { name: "Freelance Work", color: "bg-emerald-500", type: "income" },
          { name: "Business Income", color: "bg-teal-500", type: "income" },
          { name: "Investments", color: "bg-blue-500", type: "income" },
          { name: "Utilities", color: "bg-yellow-500", type: "expense" },
          { name: "Transportation", color: "bg-orange-500", type: "expense" },
          { name: "Entertainment", color: "bg-purple-500", type: "expense" },
          { name: "Healthcare", color: "bg-red-500", type: "expense" },
          { name: "Dining Out", color: "bg-pink-500", type: "expense" },
          { name: "Shopping", color: "bg-indigo-500", type: "expense" },
        ];

        const categoriesToInsert = defaultCategories.map(cat => ({
          ...cat,
          user_id: user.id
        }));

        const { data: newCategories, error: insertError } = await supabase
          .from('categories')
          .insert(categoriesToInsert)
          .select();

        if (insertError) throw insertError;
        
        console.log('Created default categories:', newCategories);
        setCategories(newCategories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      const fallbackCategories = [
        { id: "1", name: "Salary", color: "bg-green-500", type: "income" },
        { id: "2", name: "Freelance Work", color: "bg-emerald-500", type: "income" },
        { id: "3", name: "Business Income", color: "bg-teal-500", type: "income" },
        { id: "4", name: "Utilities", color: "bg-yellow-500", type: "expense" },
        { id: "5", name: "Transportation", color: "bg-orange-500", type: "expense" },
        { id: "6", name: "Entertainment", color: "bg-purple-500", type: "expense" },
        { id: "7", name: "Healthcare", color: "bg-red-500", type: "expense" },
        { id: "8", name: "Dining Out", color: "bg-pink-500", type: "expense" },
      ];
      setCategories(fallbackCategories);
    }
  };

  // Add transaction to Supabase
  const addTransaction = async (transaction: Omit<Transaction, "id" | "user_id" | "created_at">) => {
    if (!user) throw new Error("User must be logged in");

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...transaction,
            user_id: user.id,
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  // Delete transaction from Supabase
  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // Update transaction in Supabase
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) throw new Error("User must be logged in");

    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );
      
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchTransactions();
    fetchCategories();

    const subscription = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions(prev => [payload.new as Transaction, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setTransactions(prev => 
              prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    };
  }, [transactions]);

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    categories,
    summary,
    isLoading,
  };
};