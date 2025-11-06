
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Download, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Transaction, Category } from "../hooks/useTransactions";
import { toast } from "../hooks/use-toast";

interface ReportsProps {
  transactions: Transaction[];
  categories: Category[];
}

export const Reports = ({ transactions, categories }: ReportsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (selectedPeriod === "current-month") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      filtered = transactions.filter(t => t.date.startsWith(currentMonth));
    } else if (selectedPeriod === "current-year") {
      const currentYear = new Date().getFullYear().toString();
      filtered = transactions.filter(t => t.date.startsWith(currentYear));
    } else if (selectedPeriod === "specific-year") {
      filtered = transactions.filter(t => t.date.startsWith(selectedYear));
    }

    return filtered;
  }, [transactions, selectedPeriod, selectedYear]);

  const categoryData = useMemo(() => {
    const categoryTotals = filteredTransactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = { income: 0, expense: 0 };
      }
      acc[transaction.category][transaction.type] += transaction.amount;
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return Object.entries(categoryTotals).map(([category, amounts]) => {
      const categoryInfo = categories.find(c => c.name === category);
      return {
        category,
        income: amounts.income,
        expense: amounts.expense,
        total: amounts.income + amounts.expense,
        color: categoryInfo?.color?.replace('bg-', '') || 'gray-500',
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories]);

  const monthlyData = useMemo(() => {
    if (selectedPeriod !== "current-year" && selectedPeriod !== "specific-year") {
      return [];
    }

    const year = selectedPeriod === "current-year" ? new Date().getFullYear() : parseInt(selectedYear);
    const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      
      const monthTransactions = filteredTransactions.filter(t => t.date.startsWith(monthStr));
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      return {
        month: new Date(year, i).toLocaleDateString('en-US', { month: 'short' }),
        income,
        expense,
        net: income - expense,
      };
    });

    return monthlyTotals;
  }, [filteredTransactions, selectedPeriod, selectedYear]);

  const summary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const availableYears = useMemo(() => {
    const years = [...new Set(transactions.map(t => t.date.slice(0, 4)))];
    return years.sort().reverse();
  }, [transactions]);

  const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
};

  const handleExport = () => {
    const csvContent = [
      ["Title", "Amount", "Date", "Category", "Type", "Description"],
      ...filteredTransactions.map(t => [
        t.title,
        t.amount.toString(),
        t.date,
        t.category,
        t.type,
        t.description || "",
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookly-report-${selectedPeriod}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your report has been downloaded as a CSV file.",
    });
  };

  const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Analyze your financial data with detailed reports.</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="current-year">Current Year</SelectItem>
                <SelectItem value="specific-year">Specific Year</SelectItem>
              </SelectContent>
            </Select>

            {selectedPeriod === "specific-year" && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(summary.totalIncome)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(summary.totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
              {formatCurrency(summary.netIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{summary.transactionCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.filter(d => d.expense > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData.filter(d => d.expense > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="expense"
                  >
                    {categoryData.filter(d => d.expense > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No expense data available for the selected period.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" name="Income" />
                  <Bar dataKey="expense" fill="#EF4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Select a yearly period to view monthly trends.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Category</th>
                  <th className="text-right p-4 font-semibold">Income</th>
                  <th className="text-right p-4 font-semibold">Expenses</th>
                  <th className="text-right p-4 font-semibold">Net</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((item, index) => (
                  <tr key={item.category} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {item.category}
                      </div>
                    </td>
                    <td className="p-4 text-right text-green-600 font-medium">
                      {item.income > 0 ? formatCurrency(item.income) : '-'}
                    </td>
                    <td className="p-4 text-right text-red-600 font-medium">
                      {item.expense > 0 ? formatCurrency(item.expense) : '-'}
                    </td>
                    <td className={`p-4 text-right font-medium ${
                      (item.income - item.expense) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(item.income - item.expense)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
