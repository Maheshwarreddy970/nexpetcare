'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/store';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Globe,
  Zap,
  Ticket,
  Users2,
  LogOut,
  Menu,
  X,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/services', label: 'Services', icon: Zap },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/website', label: 'Website', icon: Globe },
  { href: '/admin/marketing', label: 'Marketing', icon: BarChart3 },
  { href: '/admin/team', label: 'Team', icon: Users2, rootOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings, rootOnly: true },
];

interface AdminSidebarProps {
  store: string;
  adminRole: 'root' | 'admin' | 'staff';
}

export default function AdminSidebar({ store, adminRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push(`/${store}/admin/login`);
  };

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.rootOnly && adminRole !== 'root') {
      return false;
    }
    return true;
  });

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 w-64 bg-gray-900 text-white transition-transform duration-300 z-40 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link href={`/${store}`} className="block">
            <h1 className="text-2xl font-bold">NexPetCare</h1>
            <p className="text-sm text-gray-400 mt-1">{store}</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-4 mt-8 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive =
              pathname === `/${store}${item.href}` ||
              (item.href !== '/admin' && pathname.startsWith(`/${store}${item.href}`));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={`/${store}${item.href}`}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-800">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
