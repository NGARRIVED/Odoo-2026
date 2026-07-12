import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../utils/cn";

export function AppLayout({ children }) {
  const location = useLocation();
  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Organization Setup", href: "/organization-setup" },
    { name: "Assets", href: "/assets" },
    { name: "Allocation & Transfer", href: "/allocations" },
    { name: "Resource Booking", href: "/bookings" },
    { name: "Maintenance", href: "/maintenance" },
    { name: "Audit", href: "/audit" },
    { name: "Reports", href: "/reports" },
    { name: "Notifications", href: "/notifications" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="font-bold text-lg text-gray-900 tracking-tight">AssetFlow</div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {navigation.find(n => location.pathname.startsWith(n.href))?.name || "AssetFlow"}
          </h1>
          <div className="flex items-center gap-4">
             {/* Placeholder for User Profile Menu */}
             <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-bold text-sm">
                AF
             </div>
          </div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
