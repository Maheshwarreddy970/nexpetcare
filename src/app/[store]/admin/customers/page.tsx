import { prisma } from '@/lib/store/prisma';
import { Phone, Mail, Calendar } from 'lucide-react';

interface CustomersPageProps {
  params: Promise<{ store: string }>;
}

export default async function CustomersPage(props: CustomersPageProps) {
  const params = await props.params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.store },
  });

  if (!tenant) {
    return <div>Store not found</div>;
  }

  const customers = await prisma.customer.findMany({
    where: { tenantId: tenant.id },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-gray-600 mt-2">Manage your customers</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No customers yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bookings</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer: any) => (
                <tr key={customer.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 space-y-1">
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <a href={`tel:${customer.phone}`} className="hover:text-blue-600">
                          {customer.phone}
                        </a>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <a href={`mailto:${customer.email}`} className="hover:text-blue-600">
                          {customer.email}
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {customer._count.bookings}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </div>
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