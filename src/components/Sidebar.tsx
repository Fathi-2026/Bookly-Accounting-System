import { Target } from "lucide-react";
import { Upload } from "lucide-react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Plus, List, BarChart3, DollarSign, Menu, X } from "lucide-react";
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
    { to: "/import-mpesa", icon: Upload, label: "M-Pesa Transactions" },
    { to: "/budgets", icon: Target, label: "Budgets" },   
    { to: "/transactions", icon: List, label: "Transactions" },
    { to: "/reports", icon: BarChart3, label: "Reports" },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Bookly</h1>
              <p className="text-xs text-gray-500">Accounting</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "lg:hidden fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white transform transition-transform duration-300 ease-in-out shadow-xl",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <nav className="space-y-2 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex fixed left-0 top-0 z-30 h-screen w-64 bg-white border-r border-gray-200 shadow-lg flex-col",
        className
      )}>
        {/* Desktop Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bookly</h1>
            <p className="text-sm text-gray-500">Accounting</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile spacing - This pushes content down below mobile header */}
      <div className="lg:hidden h-16" />
    </>
  );
};