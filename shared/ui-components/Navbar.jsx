import React from "react";
import { HelpCircle, Settings, LogOut, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function Navbar() {
  const userString = localStorage.getItem("assetflow_user");
  const user = userString ? JSON.parse(userString) : null;
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("assetflow_token");
    localStorage.removeItem("assetflow_user");
    navigate("/login", { replace: true });
    window.location.reload(); // Ensure all state is cleared
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center gap-4 text-gray-500">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Help" onClick={() => alert("Help center coming soon!")}>
          <HelpCircle size={20} />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Settings" onClick={() => alert("User settings panel coming soon!")}>
          <Settings size={20} />
        </button>
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => alert("Profile settings coming soon!")}>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-600 text-white flex items-center justify-center font-bold shadow-sm">
            {user ? user.name.charAt(0).toUpperCase() : <UserCircle size={20} />}
          </div>
          <div className="hidden md:block text-sm font-medium text-gray-700">
            {user ? user.name : "Guest"}
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700" title="Log Out">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
