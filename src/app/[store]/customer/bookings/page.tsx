'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCustomerBookingsAction } from '@/actions/store/customer-bookings';

interface Booking {
  id: string;
  status: string;
  service: { name: string };
  pet: { name: string };
  bookingDate: string;
  totalAmount: number;
}

export default function CustomerBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const store = params.store as string;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const customerSession = localStorage.getItem('customerSession');
    if (!customerSession) {
      router.push(`/${store}/customer/login`);
      return;
    }

    const customer = JSON.parse(customerSession);
    setSession(customer);
    fetchBookings(customer.customerId);
  }, []);

  const fetchBookings = async (customerId: string) => {
    try {
      const result = await getCustomerBookingsAction(customerId);
      if (result.success) {
        setBookings(result.bookings as Booking[]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerSession');
    router.push(`/${store}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">Welcome, {session?.name}! 👋</p>
        </div>
        <div className="space-x-2">
          <Link
            href={`/${store}/customer/booking`}
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            + Book New
          </Link>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Logout
          </Button>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{booking.service.name}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {booking.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <p className="text-gray-600">
                  <span className="font-semibold">Pet:</span> {booking.pet.name}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Date:</span>{' '}
                  {new Date(booking.bookingDate).toLocaleDateString('en-IN')}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Time:</span>{' '}
                  {new Date(booking.bookingDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-lg font-bold text-blue-600 border-t pt-3">
                  ₹{booking.totalAmount.toFixed(0)}
                </p>
              </div>

              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-600 text-lg mb-6">No bookings yet</p>
          <Link
            href={`/${store}/customer/booking`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Book Your First Appointment
          </Link>
        </div>
      )}
    </div>
  );
}
