import { prisma } from '@/lib/store/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Trash2 } from 'lucide-react';
import { deleteCoupon } from '@/actions/store/coupon-actions';

interface CouponsPageProps {
  params: Promise<{ store: string }>;
}

export default async function CouponsPage(props: CouponsPageProps) {
  const params = await props.params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.store },
  });

  if (!tenant) {
    return <div>Store not found</div>;
  }

  const coupons = await prisma.coupon.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons & Promotions</h1>
          <p className="text-gray-600 mt-2">Manage discount codes</p>
        </div>
        <Link href={`/${params.store}/admin/coupons/create`}>
          <Button className="gap-2">
            <Plus size={20} />
            Create Coupon
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">No coupons yet</p>
            <Link href={`/${params.store}/admin/coupons/create`}>
              <Button>Create First Coupon</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Discount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Expires</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Uses</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon: any) => (
                <tr key={coupon.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-gray-900">
                    {coupon.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discount}%`
                      : `₹${coupon.discount}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(coupon.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {coupon.maxUses ? `${coupon.maxUses}` : 'Unlimited'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      coupon.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <form
                      action={async () => {
                        'use server';
                        await deleteCoupon(coupon.id);
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
