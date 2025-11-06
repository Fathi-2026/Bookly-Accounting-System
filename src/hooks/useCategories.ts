import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUserCategories = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      
      setCategories(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    fetchUserCategories,
  };
};