import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: Type definitions for better TypeScript support
export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          type: 'income' | 'expense' | 'both';
          user_id: string;
          created_at: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          title: string;
          amount: number;
          date: string;
          category: string;
          type: 'income' | 'expense';
          description?: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};