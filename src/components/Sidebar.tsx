import { Target, Upload, LayoutDashboard, Plus, List, BarChart3, DollarSign, Menu, X, PieChart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/add-transaction", icon: Plus, label: "Add Transaction" },
    { to: "/import-mpesa", icon: Upload, label: "M-Pesa Import" },
    { to: "/budgets", icon: Target, label: "Budgets" },   
    { to: "/transactions", icon: List, label: "Transactions" },
    { to: "/reports", icon: BarChart3, label: "Reports" },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Bookly</h1>
              <p className="text-xs text-gray-300">Finance Tracker</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "lg:hidden fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 bg-gradient-to-b from-gray-900 to-gray-800 transform transition-transform duration-300 ease-in-out shadow-2xl border-r border-gray-700",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Navigation */}
        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )
              }
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                "group-hover:scale-110"
              )} />
              <span className="font-semibold">{item.label}</span>
              {({ isActive }) => isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
          <div className="bg-gray-800/50 rounded-2xl p-4 text-center backdrop-blur-sm">
            <p className="text-sm text-gray-300 font-medium">Manage your finances</p>
            <p className="text-xs text-gray-500 mt-1">with confidence</p>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex fixed left-0 top-0 z-30 h-screen w-72 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 shadow-2xl flex-col",
        className
      )}>
        {/* Desktop Logo */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-700">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Bookly</h1>
            <p className="text-sm text-gray-300">Finance Tracker</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    "group-hover:scale-110"
                  )} />
                  <span className="font-semibold">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Footer */}
        <div className="p-6 border-t border-gray-700">
          <div className="bg-gray-800/50 rounded-2xl p-4 text-center backdrop-blur-sm border border-gray-600/50">
            <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <PieChart className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-gray-300 font-medium">Financial Insights</p>
            <p className="text-xs text-gray-500 mt-1">Track • Analyze • Grow</p>
          </div>
        </div>
      </div>

      {/* Mobile spacing - This pushes content down below mobile header */}
      <div className="lg:hidden h-16" />
    </>
  );
};