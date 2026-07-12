import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../utils/cn";
import { 
  LayoutDashboard, 
  Building2, 
  Box, 
  ArrowRightLeft, 
  CalendarDays, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  Bell,
  UserCircle
} from "lucide-react";

export function Sidebar() {
  const location = useLocation();
<<<<<<< Updated upstream
  const user = JSON.parse(localStorage.getItem('assetflow_user') || '{}');
=======
  const userString = localStorage.getItem("assetflow_user");
  const user = userString ? JSON.parse(userString) : null;
>>>>>>> Stashed changes

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Organization setup", href: "/organization", icon: Building2, roles: ['ADMIN'] },
    { name: "Assets", href: "/assets", icon: Box },
    { name: "Allocation & Transfer", href: "/allocations", icon: ArrowRightLeft, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
    { name: "Resource Booking", href: "/bookings", icon: CalendarDays },
    { name: "Maintenance", href: "/maintenance", icon: Wrench },
    { name: "Audit", href: "/audits", icon: ClipboardCheck, roles: ['ADMIN'] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  return (
    <aside className="w-64 bg-[#1E293B] text-slate-300 flex-shrink-0 flex flex-col h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800/50 bg-[#0F172A]/30">
        <div className="flex items-center gap-2">
          <div className="bg-white text-slate-900 rounded-[4px] px-1.5 py-0.5 text-xs font-bold leading-tight">AF</div>
          <div>
            <div className="font-bold text-white text-base leading-tight">AssetFlow</div>
            <div className="text-[10px] text-slate-400 leading-tight">Enterprise EAM</div>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-slate-800/80 text-white shadow-sm border border-slate-700/50"
                  : "hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <Icon size={18} className={cn(isActive ? "text-blue-400" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <button 
          onClick={() => alert("Profile settings coming soon!")}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium hover:text-white transition-colors w-full text-left overflow-hidden"
        >
          <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white flex-shrink-0 font-bold">
            {user ? user.name.charAt(0).toUpperCase() : <UserCircle size={18} />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-slate-200">{user ? user.name : "Unknown User"}</span>
            <span className="truncate text-[10px] text-slate-500">{user ? user.role : "GUEST"}</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
