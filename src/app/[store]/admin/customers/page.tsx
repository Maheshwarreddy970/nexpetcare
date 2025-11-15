'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getCustomersAction, deleteCustomerAction } from '@/actions/admin/customers';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  _count: { bookings: number };
  createdAt: string; // ISO string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const sessionStr = localStorage.getItem('adminSession');
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);
    const result = await getCustomersAction(session.tenantId);

    if (result.success) {
      setCustomers(result.customers as Customer[]);
    }
    setLoading(false);
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure?')) return;

    const result = await deleteCustomerAction(customerId);
    if (result.success) {
      setCustomers(customers.filter((c) => c.id !== customerId));
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-2">Manage your customer base</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">👥</div>
            <p>No customers yet</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bookings
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {customer._count.bookings}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="mr-2">
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(customer.id)}
                    >
                      Delete
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
