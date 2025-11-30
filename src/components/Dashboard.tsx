import { useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, Plus } from "lucide-react";
import { Transaction, Category } from "../hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Link } from "react-router-dom";

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
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
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
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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
      if (transaction.type === 'income') {
        acc[transaction.category].income += transaction.amount;
      } else {
        acc[transaction.category].expense += Math.abs(transaction.amount);
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return Object.entries(breakdown).map(([category, amounts]) => ({
      category,
      ...amounts,
      net: amounts.income - amounts.expense,
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
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
            <p className="text-blue-100 text-lg">Welcome back! Here's your financial summary</p>
          </div>
          <Link
            to="/add-transaction"
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Transaction
          </Link>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Income</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 mb-1">{formatCurrency(stats.totalIncome)}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              +{formatCurrency(stats.monthlyIncome)} this month
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Expenses</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 mb-1">{formatCurrency(stats.totalExpenses)}</div>
            <p className="text-xs text-red-600">
              {formatCurrency(stats.monthlyExpenses)} this month
            </p>
          </CardContent>
        </Card>

        {/* Net Balance Card */}
        <Card className={`bg-gradient-to-br ${
          stats.balance >= 0 
            ? 'from-blue-50 to-indigo-50 border-blue-200' 
            : 'from-orange-50 to-red-50 border-orange-200'
        } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${
              stats.balance >= 0 ? 'text-blue-800' : 'text-orange-800'
            }`}>
              Net Balance
            </CardTitle>
            <div className={`p-2 rounded-lg ${
              stats.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
            }`}>
              <DollarSign className={`h-4 w-4 ${
                stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold mb-1 ${
              stats.balance >= 0 ? 'text-blue-900' : 'text-orange-900'
            }`}>
              {formatCurrency(stats.balance)}
            </div>
            <p className={`text-xs ${
              stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {stats.balance >= 0 ? 'Positive balance' : 'Review expenses'}
            </p>
          </CardContent>
        </Card>

        {/* Transactions Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Transactions</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <PieChart className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 mb-1">{transactions.length}</div>
            <p className="text-xs text-purple-600">Total recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Recent Transactions & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
              <Link 
                to="/transactions" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentTransactions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No transactions yet
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'income' ? 
                            <TrendingUp className="h-5 w-5" /> : 
                            <TrendingDown className="h-5 w-5" />
                          }
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{transaction.title || 'No Title'}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">
                              {transaction.category}
                            </span>
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
            <CardTitle className="text-lg font-bold">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {categoryBreakdown.slice(0, 6).length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No category data
                </div>
              ) : (
                categoryBreakdown.slice(0, 6).map((item) => (
                  <div key={item.category} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          item.net >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium text-gray-900">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${item.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(item.net))}
                        </p>
                        <div className="flex gap-2 text-xs text-gray-600">
                          {item.income > 0 && <span>+{formatCurrency(item.income)}</span>}
                          {item.expense > 0 && <span>-{formatCurrency(item.expense)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};