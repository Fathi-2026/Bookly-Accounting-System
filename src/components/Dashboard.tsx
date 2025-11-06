
import { useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { Transaction, Category } from "../hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
}

export const Dashboard = ({ transactions, categories }: DashboardProps) => {
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;

    // Get current month transactions
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthTransactions = transactions.filter(
      t => t.date.startsWith(currentMonth)
    );
    
    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      balance,
      monthlyIncome,
      monthlyExpenses,
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const breakdown = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = { income: 0, expense: 0 };
      }
      acc[transaction.category][transaction.type] += transaction.amount;
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return Object.entries(breakdown).map(([category, amounts]) => ({
      category,
      ...amounts,
      total: amounts.income + amounts.expense,
    }));
  }, [transactions]);

  const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalIncome)}</div>
            <p className="text-xs text-green-600 mt-1">
              +{formatCurrency(stats.monthlyIncome)} this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(stats.totalExpenses)}</div>
            <p className="text-xs text-red-600 mt-1">
              -{formatCurrency(stats.monthlyExpenses)} this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
              {formatCurrency(stats.balance)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {stats.balance >= 0 ? 'Positive' : 'Negative'} balance
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Transactions</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{transactions.length}</div>
            <p className="text-xs text-purple-600 mt-1">Total recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{transaction.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{transaction.category}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 6).map((item) => {
                const category = categories.find(c => c.name === item.category);
                return (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${category?.color || 'bg-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-900">{item.category}</span>
                    </div>
                    <div className="text-right">
                      {item.income > 0 && (
                        <div className="text-sm text-green-600">+{formatCurrency(item.income)}</div>
                      )}
                      {item.expense > 0 && (
                        <div className="text-sm text-red-600">-{formatCurrency(item.expense)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};