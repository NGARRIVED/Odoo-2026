import React from "react";
import { HelpCircle, Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center gap-4 text-gray-500">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Help">
          <HelpCircle size={20} />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Settings">
          <Settings size={20} />
        </button>
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
             <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
        <Link to="/login" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700" title="Log Out">
          <LogOut size={20} />
        </Link>
      </div>
    </header>
  );
}
