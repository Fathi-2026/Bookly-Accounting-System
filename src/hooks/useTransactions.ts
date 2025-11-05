import { useState, useMemo } from "react";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: "income" | "expense" | "both";
}

const defaultCategories: Category[] = [
  { id: "1", name: "Freelance Work", color: "bg-green-500", type: "income" },
  { id: "2", name: "Consulting", color: "bg-emerald-500", type: "income" },
  { id: "3", name: "Product Sales", color: "bg-teal-500", type: "income" },
  { id: "4", name: "Office Supplies", color: "bg-blue-500", type: "expense" },
  { id: "5", name: "Software", color: "bg-indigo-500", type: "expense" },
  { id: "6", name: "Marketing", color: "bg-purple-500", type: "expense" },
  { id: "7", name: "Travel", color: "bg-pink-500", type: "expense" },
  { id: "8", name: "Meals", color: "bg-orange-500", type: "expense" },
];

const dummyTransactions: Transaction[] = [
  {
    id: "1",
    title: "Website Development Project",
    amount: 2500,
    date: "2024-06-01",
    category: "Freelance Work",
    type: "income",
    description: "Client website project completion"
  },
  {
    id: "2",
    title: "Adobe Creative Suite",
    amount: 52.99,
    date: "2024-06-01",
    category: "Software",
    type: "expense",
    description: "Monthly subscription"
  },
  {
    id: "3",
    title: "Business Consultation",
    amount: 800,
    date: "2024-05-28",
    category: "Consulting",
    type: "income",
    description: "Strategy consultation session"
  },
  {
    id: "4",
    title: "Office Chair",
    amount: 299,
    date: "2024-05-25",
    category: "Office Supplies",
    type: "expense",
    description: "Ergonomic office chair"
  },
  {
    id: "5",
    title: "E-book Sales",
    amount: 1200,
    date: "2024-05-20",
    category: "Product Sales",
    type: "income",
    description: "Digital product sales"
  },
  {
    id: "6",
    title: "Google Ads",
    amount: 150,
    date: "2024-05-15",
    category: "Marketing",
    type: "expense",
    description: "Online advertising campaign"
  },
];

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(dummyTransactions);
  const [categories] = useState<Category[]>(defaultCategories);

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

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
    categories,
    summary,
  };
};