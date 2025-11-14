'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/store';
import StatsCard from '@/components/admin/stats-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { getAdminStats } from '@/actions/store/admin-stats';
import { getStoreBySlug } from '@/actions/store/get-store';

interface AdminStats {
  totalBookings: number;
  totalCustomers: number;
  totalServices: number;
  totalRevenue: number;
  recentBookings: any[];
}

export default function AdminDashboard() {
  const params = useParams();
  const store = params.store as string;
  
  const tenant = useStore((state) => state.tenant);
  const setTenant = useStore((state) => state.setTenant);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // If tenant not in store, fetch it
        if (!tenant) {
          const storeData = await getStoreBySlug(store);
          if (storeData) {
            setTenant({
              id: storeData.id,
              name: storeData.name,
              slug: storeData.slug,
              email: storeData.email,
              phone: storeData.phone,
              websiteData: storeData.websiteData,
            });

            // Fetch stats with the new tenant ID
            const data = await getAdminStats(storeData.id);
            setStats(data);
          }
        } else {
          // Fetch stats with existing tenant
          const data = await getAdminStats(tenant.id);
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [store, tenant, setTenant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Store Data</h1>
          <p className="text-gray-600 mb-4">Unable to load store information.</p>
          <Link href={`/${store}`}>
            <Button>Visit Store Page</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to {tenant.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatsCard
          label="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={Calendar}
          color="bg-blue-500"
        />
        <StatsCard
          label="Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color="bg-green-500"
        />
        <StatsCard
          label="Services"
          value={stats?.totalServices || 0}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatsCard
          label="Revenue"
          value={`₹${(stats?.totalRevenue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="bg-yellow-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Link href={`/${store}/admin/services/create`}>
            <Button variant="outline" className="w-full">
              + Add Service
            </Button>
          </Link>
          <Link href={`/${store}/admin/bookings`}>
            <Button variant="outline" className="w-full">
              View Bookings
            </Button>
          </Link>
          <Link href={`/${store}/admin/website`}>
            <Button variant="outline" className="w-full">
              Edit Website
            </Button>
          </Link>
          <Link href={`/${store}/admin/settings`}>
            <Button variant="outline" className="w-full">
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          {stats && stats.recentBookings.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((booking: any) => (
                  <tr key={booking.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {booking.customer?.name || 'Guest'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.service?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(booking.bookingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-gray-600">
              <p>No bookings yet</p>
            </div>
          )}
        </div>
        {stats && stats.recentBookings.length > 0 && (
          <div className="p-6 border-t border-gray-200 text-center">
            <Link href={`/${store}/admin/bookings`}>
              <Button variant="link">View All Bookings →</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
