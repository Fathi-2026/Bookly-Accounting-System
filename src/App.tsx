import { Budgets } from "@/components/Budgets";
import { ImportMpesa } from "@/components/ImportMpesa";
import { AddTransaction } from "@/components/AddTransaction";
import { EditTransaction } from "@/components/EditTransaction";
import { TransactionsTable } from "@/components/TransactionsTable"; 
import { Reports } from "@/components/Reports";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useTransactions } from "./hooks/useTransactions";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Sidebar } from "@/components/Sidebar";
import { HomePage } from "./pages/HomePage";

const queryClient = new QueryClient();

// Wrapper components that pass the required props
const AddTransactionWrapper = () => {
  const { addTransaction, categories, isLoading } = useTransactions();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading categories...</div>;
  }
  
  return <AddTransaction onAddTransaction={addTransaction} categories={categories} />;
};

const ImportMpesaWrapper = () => {
  return <ImportMpesa />;
};

const BudgetsWrapper = () => {
  return <Budgets />;
};

const EditTransactionWrapper = () => {
  const { transactions, categories, updateTransaction, isLoading } = useTransactions();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <EditTransaction 
      transactions={transactions} 
      categories={categories}
      onUpdateTransaction={updateTransaction}
    />
  );
};

const TransactionsTableWrapper = () => {
  const { transactions, categories, deleteTransaction, isLoading } = useTransactions();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <TransactionsTable 
      transactions={transactions} 
      categories={categories}
      onDeleteTransaction={deleteTransaction}
    />
  );
};

const ReportsWrapper = () => {
  const { transactions, categories, isLoading } = useTransactions();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <Reports transactions={transactions} categories={categories} />;
};

// Main Layout - FIXED VERSION
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - NO EXTRA WRAPPER needed since Sidebar has its own fixed positioning */}
      <Sidebar />
      
      {/* Main content area - CHANGED to lg:ml-72 to match sidebar width */}
      <div className="ml-0 lg:ml-72 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:block bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Finance Tracker</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{user?.email}</span>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header with Logout */}
        <header className="lg:hidden bg-white shadow-sm border-b p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Finance Tracker</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.firstName}!</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main content with proper mobile padding */}
        <main className="p-4 lg:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return user ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" replace />;
};

// Public Route - FIXED: Redirect to "/" (Index) instead of "/dashboard"
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return !user ? <>{children}</> : <Navigate to="/" replace />; // ← CHANGED BACK TO "/"
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/home" element={<HomePage />} /> {/* ← CHANGED FROM "/" TO "/home" */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} /> {/* ← MAIN APP AT ROOT */}
      <Route path="/add-transaction" element={<ProtectedRoute><AddTransactionWrapper /></ProtectedRoute>} />
      <Route path="/import-mpesa" element={<ProtectedRoute><ImportMpesaWrapper /></ProtectedRoute>} /> 
      <Route path="/budgets" element={<ProtectedRoute><BudgetsWrapper /></ProtectedRoute>} />
      <Route path="/edit-transaction/:id" element={<ProtectedRoute><EditTransactionWrapper /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><TransactionsTableWrapper /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsWrapper /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;