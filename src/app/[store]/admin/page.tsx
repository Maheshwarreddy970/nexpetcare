'use client';

import { useEffect, useState } from 'react';
import { getDashboardStatsAction } from '@/actions/admin/dashboard';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    bookings: 0,
    customers: 0,
    revenue: 0,
    services: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const sessionStr = localStorage.getItem('adminSession');
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);
    const result = await getDashboardStatsAction(session.tenantId);

    if (result.success) {
      setStats(result.stats);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.bookings}
              </p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.customers}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₹{(stats.revenue / 100).toFixed(0)}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Services</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.services}
              </p>
            </div>
            <div className="text-4xl">🛠️</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome!</h2>
        <p className="text-gray-600">
          Your store is all set. Start managing bookings, customers, and services from the navigation menu.
        </p>
      </div>
    </div>
  );
}
