'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { customerLoginAction } from '@/actions/store/customer-auth';

export default function CustomerLoginPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = params.store as string;
  const serviceId = searchParams.get('service');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('customerSession');
    if (session) {
      if (serviceId) {
        router.push(`/${store}/customer/booking?service=${serviceId}`);
      } else {
        router.push(`/${store}`);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await customerLoginAction({
      storeSlug: store,
      email: formData.email,
      password: formData.password,
    });

    console.log('🔐 Login result:', result); // ✅ Debug log

    if (result.success && result.customer) {
      // ✅ Store the customer object directly - it already has all fields
      console.log('✅ Storing session:', result.customer);
      localStorage.setItem('customerSession', JSON.stringify(result.customer));

      if (serviceId) {
        router.push(`/${store}/customer/booking?service=${serviceId}`);
      } else {
        router.push(`/${store}`);
      }
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Login</h1>
          <p className="text-gray-600">Book your appointment</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-3">Don't have an account?</p>
          <Link
            href={`/${store}/customer/signup${serviceId ? `?service=${serviceId}` : ''}`}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
