
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Trash2, Search, Filter, ArrowUpDown } from "lucide-react";
import { Transaction, Category } from "../hooks/useTransactions";
import { toast } from "../hooks/use-toast";

interface TransactionsTableProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  categories: Category[];
}

export const TransactionsTable = ({ 
  transactions, 
  onDeleteTransaction, 
  categories 
}: TransactionsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      const matchesSearch = transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;
      const matchesType = filterType === "all" || transaction.type === filterType;
      
      return matchesSearch && matchesCategory && matchesType;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, filterCategory, filterType, sortBy, sortOrder]);

  const handleSort = (field: "date" | "amount" | "title") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      onDeleteTransaction(id);
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed successfully.",
      });
    }
  };

 const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">View and manage all your transactions.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${category.color}`} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("all");
                setFilterType("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("title")}
                      className="flex items-center gap-1 p-0 h-auto font-semibold"
                    >
                      Title
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </th>
                  <th className="text-left p-4">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("amount")}
                      className="flex items-center gap-1 p-0 h-auto font-semibold"
                    >
                      Amount
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </th>
                  <th className="text-left p-4">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-1 p-0 h-auto font-semibold"
                    >
                      Date
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-semibold">Category</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedTransactions.map((transaction) => {
                    const category = categories.find(c => c.name === transaction.category);
                    return (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-gray-900">{transaction.title}</div>
                            {transaction.description && (
                              <div className="text-sm text-gray-500 mt-1">{transaction.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">{formatDate(transaction.date)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${category?.color || 'bg-gray-400'}`} />
                            <span className="text-sm text-gray-900">{transaction.category}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                            {transaction.type}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction.id, transaction.title)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {filteredAndSortedTransactions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
