'use client';

import { User, Bell } from 'lucide-react';

interface AdminHeaderProps {
  tenantName: string;
  email: string;
}

export default function AdminHeader({ tenantName, email }: AdminHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Store Name */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{tenantName}</h2>
          <p className="text-sm text-gray-600">Admin Dashboard</p>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <button className="relative text-gray-600 hover:text-gray-900 transition">
            <Bell size={24} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow">
              <User size={20} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-600">{email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
