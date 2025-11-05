import { Dashboard } from "@/components/Dashboard";
import { useTransactions } from "@/hooks/useTransactions";

const Index = () => {
  const { transactions, categories } = useTransactions();

  return (
    <Dashboard transactions={transactions} categories={categories} />
  );
};

export default Index;