import { prisma } from '@/lib/store/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { deleteService } from '@/actions/store/service-actions';

interface ServicesPageProps {
  params: Promise<{ store: string }>;
}

export default async function ServicesPage(props: ServicesPageProps) {
  const params = await props.params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.store },
  });

  if (!tenant) {
    return <div>Store not found</div>;
  }

  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-gray-600 mt-2">Manage your services and pricing</p>
        </div>
        <Link href={`/${params.store}/admin/services/create`}>
          <Button className="gap-2">
            <Plus size={20} />
            Add Service
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {services.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">No services yet</p>
            <Link href={`/${params.store}/admin/services/create`}>
              <Button>Create Service</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service: any) => (
                <tr key={service.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{service.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">₹{service.price}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{service.duration} min</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      service.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <Link href={`/${params.store}/admin/services/${service.id}/edit`}>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Edit size={16} />
                      </Button>
                    </Link>
                    <form
                      action={async () => {
                        'use server';
                        await deleteService(service.id);
                      }}
                      style={{ display: 'inline' }}
                    >
                      <Button size="sm" variant="destructive" className="gap-2">
                        <Trash2 size={16} />
                      </Button>
                    </form>
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
