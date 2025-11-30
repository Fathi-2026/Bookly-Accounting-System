import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Plus, Trash2, Target } from 'lucide-react';
import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';
import { toast } from '../hooks/use-toast';

export const Budgets = () => {
  const navigate = useNavigate();
  const { budgets, addBudget, deleteBudget, isLoading } = useBudgets();
  const { categories } = useTransactions();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
  });

  // Debug effect to check budget data
  useEffect(() => {
    console.log('Budgets data:', budgets);
  }, [budgets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      await addBudget({
        category: formData.category,
        amount,
        period: formData.period,
        currency: 'KES'
      });

      toast({
        title: "Success!",
        description: "Budget created successfully",
      });

      setFormData({
        category: '',
        amount: '',
        period: 'monthly',
      });
      setShowForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create budget",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, category: string) => {
    if (window.confirm(`Are you sure you want to delete the budget for ${category}?`)) {
      try {
        await deleteBudget(id);
        toast({
          title: "Budget deleted",
          description: "The budget has been removed successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete budget",
          variant: "destructive",
        });
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
            <p className="text-gray-600 mt-1">Set spending limits and track your budget progress</p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Budget
        </Button>
      </div>

      {/* Budget Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Budget Amount (KSh)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="period">Period</Label>
                  <Select value={formData.period} onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => setFormData(prev => ({ ...prev, period: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit">Create Budget</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Budgets List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading budgets...</div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
              <p className="mb-4">Create your first budget to start tracking your spending limits</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => (
                <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        budget.isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <h3 className="font-semibold text-lg">{budget.category}</h3>
                      <span className="text-sm text-gray-500 capitalize">({budget.period})</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Budget:</span>
                        <div className="font-semibold">{formatCurrency(budget.amount)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Spent:</span>
                        <div className={`font-semibold ${
                          budget.currentSpending > 0 ? 'text-orange-600' : 'text-gray-600'
                        }`}>
                          {formatCurrency(budget.currentSpending)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Remaining:</span>
                        <div className={`font-semibold ${
                          budget.remaining < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(budget.remaining)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.min(budget.percentage, 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            budget.percentage > 100 ? 'bg-red-500' : 
                            budget.percentage > 80 ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Over Budget Warning */}
                    {budget.isOverBudget && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center gap-2 text-red-700 text-sm">
                          <Target className="h-4 w-4" />
                          <span>Budget exceeded by {formatCurrency(Math.abs(budget.remaining))}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(budget.id, budget.category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};