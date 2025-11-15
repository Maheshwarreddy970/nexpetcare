'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getBookingsAction, updateBookingStatusAction } from '@/actions/admin/bookings';

interface Booking {
  id: string;
  status: string;
  service: { name: string };
  customer: { name: string; email: string };
  bookingDate: string; // ISO string
  createdAt: string; // ISO string
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const sessionStr = localStorage.getItem('adminSession');
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);
    const result = await getBookingsAction(session.tenantId);

    if (result.success) {
      setBookings(result.bookings as Booking[]);
    }
    setLoading(false);
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    const result = await updateBookingStatusAction(bookingId, newStatus as any);

    if (result.success) {
      setBookings(
        bookings.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    }
  };

  const filteredBookings =
    filter === 'all'
      ? bookings
      : bookings.filter((b) => b.status === filter);

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
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600 mt-2">Manage customer bookings</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'confirmed', 'completed', 'canceled'].map(
          (status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? 'default' : 'outline'}
              className={filter === status ? 'bg-blue-600' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          )
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">📅</div>
            <p>No bookings yet</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.customer.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.customer.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {booking.service.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChange(booking.id, e.target.value)
                      }
                      className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                        booking.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'canceled'
                          ? 'bg-red-100 text-red-800'
                          : booking.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(booking.bookingDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
