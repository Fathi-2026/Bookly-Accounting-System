import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Smartphone, Upload, Download } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { toast } from '../hooks/use-toast';

export const ImportMpesa = () => {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  
  // Manual form data
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    phoneNumber: '',
    transactionId: ''
  });

  // Manual entry handlers
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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

      await addTransaction({
        title: `M-Pesa ${formData.type === 'income' ? 'Receive' : 'Send'}: ${formData.description}`,
        amount,
        date: formData.date,
        category: formData.category,
        type: formData.type,
        description: formData.phoneNumber ? `Phone: ${formData.phoneNumber}${formData.transactionId ? ` | ID: ${formData.transactionId}` : ''}` : formData.description
      });

      toast({
        title: "Success!",
        description: "M-Pesa transaction added successfully",
      });

      // Reset form
      setFormData({
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        phoneNumber: '',
        transactionId: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // File import handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      const text = await file.text();
      const transactions = parseMpesaCSV(text);
      
      let successCount = 0;
      for (const transaction of transactions) {
        try {
          await addTransaction(transaction);
          successCount++;
        } catch (error) {
          console.error('Failed to add transaction:', transaction.title, error);
        }
      }
      
      toast({
        title: "Import successful!",
        description: `Successfully imported ${successCount} of ${transactions.length} M-Pesa transactions`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "Failed to import M-Pesa transactions. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const parseMpesaCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i];
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        
        if (columns.length < 7) continue;
        
        const [receiptNo, completionTime, details, status, paidIn, withdrawn, balance] = columns;
        
        if (status !== 'Completed') continue;
        
        let amount = 0;
        let type: 'income' | 'expense' = 'expense';
        
        if (paidIn && parseFloat(paidIn) > 0) {
          amount = parseFloat(paidIn);
          type = 'income';
        } else if (withdrawn && parseFloat(withdrawn) > 0) {
          amount = parseFloat(withdrawn);
          type = 'expense';
        } else {
          continue;
        }
        
        if (amount <= 0) continue;
        
        const category = categorizeMpesaTransaction(details);
        const date = formatMpesaDate(completionTime);
        
        transactions.push({
          title: `M-Pesa: ${details}`,
          amount,
          date,
          category,
          type,
          description: `Receipt: ${receiptNo}`
        });
      } catch (error) {
        console.error('Error parsing line:', error);
      }
    }
    
    return transactions;
  };

  const categorizeMpesaTransaction = (details: string): string => {
    const detail = details.toLowerCase();
    
    if (detail.includes('airtime') || detail.includes('data')) return 'Airtime';
    if (detail.includes('paybill') || detail.includes('bill')) return 'Bills';
    if (detail.includes('till') || detail.includes('merchant')) return 'Shopping';
    if (detail.includes('sent to') || detail.includes('transfer')) return 'Transfer';
    if (detail.includes('received from') || detail.includes('deposit')) return 'Income';
    if (detail.includes('withdraw') || detail.includes('agent')) return 'Withdrawal';
    if (detail.includes('fare') || detail.includes('transport')) return 'Transport';
    
    return 'Other';
  };

  const formatMpesaDate = (dateString: string): string => {
    try {
      return dateString.split(' ')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const downloadTemplate = () => {
    const template = `Receipt No,Completion Time,Details,Transaction Status,Paid In,Withdrawn,Balance
"RFV123456","2024-01-15 14:30:25","Payment to JOE SUPERMARKET","Completed","","500.00","15000.00"
"RFV123457","2024-01-15 10:15:00","Airtime Purchase","Completed","","100.00","15500.00"
"RFV123458","2024-01-14 16:45:30","Received from JOHN DOE","Completed","2000.00","","15600.00"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mpesa-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const mpesaCategories = [
    { value: 'Airtime', label: 'Airtime & Data' },
    { value: 'Shopping', label: 'Shopping & Merchants' },
    { value: 'Bills', label: 'Bills & Paybill' },
    { value: 'Transport', label: 'Transport & Fuel' },
    { value: 'Transfer', label: 'Send Money' },
    { value: 'Income', label: 'Receive Money' },
    { value: 'Withdrawal', label: 'Cash Withdrawal' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold text-gray-900">M-Pesa Transactions</h1>
          <p className="text-gray-600 mt-1">Add M-Pesa transactions manually or import from CSV</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            CSV Import
          </TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add M-Pesa Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (KSh)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => handleChange('amount', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label>Transaction Type</Label>
                    <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => handleChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Money Sent / Payment</SelectItem>
                        <SelectItem value="income">Money Received</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {mpesaCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      placeholder="07XXXXXXXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                    <Input
                      id="transactionId"
                      type="text"
                      value={formData.transactionId}
                      onChange={(e) => handleChange('transactionId', e.target.value)}
                      placeholder="RFV123456"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="e.g., Airtime purchase, Supermarket payment, etc."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Adding...' : 'Add M-Pesa Transaction'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">💡</div>
                    <div>
                      <h4 className="font-semibold">Use SMS Details</h4>
                      <p className="text-sm text-gray-600">Check your M-Pesa SMS for accurate details</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">💡</div>
                    <div>
                      <h4 className="font-semibold">Transaction ID</h4>
                      <p className="text-sm text-gray-600">Use the RFV code from your receipt</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">💡</div>
                    <div>
                      <h4 className="font-semibold">Categorize Properly</h4>
                      <p className="text-sm text-gray-600">Choose the right category for better reports</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CSV Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import from CSV File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="hidden"
                  id="mpesa-file"
                />
                <label
                  htmlFor="mpesa-file"
                  className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-block mb-2"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Choose CSV File
                    </div>
                  )}
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  Upload M-Pesa statement in CSV format
                </p>
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Download className="h-4 w-4" />
                  Download Sample Template
                </Button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Note about M-Pesa PDFs</h4>
                <p className="text-sm text-yellow-700">
                  M-Pesa statements come as password-protected PDFs. You'll need to:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
                  <li>Convert PDF to CSV using online tools</li>
                  <li>Or use the manual entry option above</li>
                  <li>Download the template to see the required format</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};