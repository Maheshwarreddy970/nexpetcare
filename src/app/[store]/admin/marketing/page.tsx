'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createCouponAction,
  getCouponsAction,
  sendCouponToAllCustomersAction,
  announceNewServiceAction,
  deleteCouponAction,
  deactivateCouponAction,
} from '@/actions/admin/marketing';
import { getServicesAction } from '@/actions/admin/services';
import { Trash2, Send, ToggleLeft, ToggleRight } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  expiresAt: string;
  isActive: boolean;
}

export default function MarketingPage() {
  const [session, setSession] = useState<any>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showServiceAnnouncement, setShowServiceAnnouncement] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);

  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as const,
    discountValue: '',
    expiresAt: '',
  });

  const [selectedService, setSelectedService] = useState('');

  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      const admin = JSON.parse(adminSession);
      setSession(admin);
      fetchData(admin.tenantId);
    }
  }, []);

  const fetchData = async (tenantId: string) => {
    const [couponsResult, servicesResult] = await Promise.all([
      getCouponsAction(tenantId),
      getServicesAction(tenantId),
    ]);

    if (couponsResult.success) {
      setCoupons(couponsResult.coupons as Coupon[]);
    }

    if (servicesResult.success) {
      setServices(servicesResult.services);
    }

    setLoading(false);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await createCouponAction(session.tenantId, {
      code: couponForm.code,
      description: couponForm.description,
      discountType: couponForm.discountType,
      discountValue: parseFloat(couponForm.discountValue),
      expiresAt: couponForm.expiresAt,
    });

    if (result.success) {
      alert('Coupon created successfully!');
      fetchData(session.tenantId);
      setShowCouponForm(false);
      setCouponForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        expiresAt: '',
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string, couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${couponCode}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingCouponId(couponId);

    const result = await deleteCouponAction(session.tenantId, couponId);

    if (result.success) {
      alert(result.message);
      fetchData(session.tenantId);
    } else {
      alert(result.error);
    }

    setDeletingCouponId(null);
  };

  const handleToggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    if (!currentStatus) {
      // If currently inactive, we need to reactivate (not implemented yet)
      alert('Reactivation feature coming soon!');
      return;
    }

    if (!confirm('Deactivate this coupon? It will no longer be available for use.')) {
      return;
    }

    const result = await deactivateCouponAction(session.tenantId, couponId);

    if (result.success) {
      alert(result.message);
      fetchData(session.tenantId);
    } else {
      alert(result.error);
    }
  };

  const handleSendCoupon = async (couponId: string) => {
    if (!confirm('Send this coupon to all customers?')) return;

    const result = await sendCouponToAllCustomersAction(
      session.tenantId,
      couponId,
      session.tenantName
    );

    if (result.success) {
      alert(result.message);
    }
  };

  const handleAnnounceService = async () => {
    if (!selectedService) return;

    if (!confirm('Send announcement to all customers?')) return;

    const result = await announceNewServiceAction(
      session.tenantId,
      selectedService,
      session.tenantName
    );

    if (result.success) {
      alert(result.message);
      setShowServiceAnnouncement(false);
      setSelectedService('');
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
        <p className="text-gray-600 mt-2">Engage with your customers</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-4">💳</div>
          <h3 className="text-lg font-semibold mb-2">Discount Coupons</h3>
          <p className="text-gray-600 mb-4">Create and send discount coupons</p>
          <Button
            onClick={() => setShowCouponForm(!showCouponForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Coupon
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-4">🎉</div>
          <h3 className="text-lg font-semibold mb-2">Service Announcements</h3>
          <p className="text-gray-600 mb-4">Announce new services to customers</p>
          <Button
            onClick={() => setShowServiceAnnouncement(!showServiceAnnouncement)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Announce Service
          </Button>
        </div>
      </div>

      {/* Create Coupon Form */}
      {showCouponForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Create Discount Coupon</h2>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Coupon Code</label>
                <Input
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                  }
                  placeholder="SAVE10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expiry Date</label>
                <Input
                  type="date"
                  value={couponForm.expiresAt}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, expiresAt: e.target.value })
                  }
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={couponForm.description}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, description: e.target.value })
                }
                placeholder="Get 10% off on all services"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Discount Type</label>
                <select
                  value={couponForm.discountType}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      discountType: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {couponForm.discountType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
                </label>
                <Input
                  type="number"
                  value={couponForm.discountValue}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, discountValue: e.target.value })
                  }
                  placeholder={couponForm.discountType === 'percentage' ? '10' : '100'}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Create Coupon
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCouponForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Service Announcement */}
      {showServiceAnnouncement && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Announce New Service</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Service</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Choose a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAnnounceService}
                disabled={!selectedService}
                className="bg-green-600 hover:bg-green-700"
              >
                Send Announcement
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowServiceAnnouncement(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Coupons List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Active Coupons</h2>
        </div>
        <div className="p-6">
          {coupons.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No coupons created yet</p>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-blue-600">
                          {coupon.code}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            coupon.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} OFF`}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">{coupon.description}</p>
                      <p className="text-gray-500 text-xs">
                        Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle Active/Inactive */}
                      <Button
                        onClick={() => handleToggleCouponStatus(coupon.id, coupon.isActive)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        title={coupon.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {coupon.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>

                      {/* Send to All */}
                      <Button
                        onClick={() => handleSendCoupon(coupon.id)}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                        size="sm"
                        disabled={!coupon.isActive}
                      >
                        <Send className="h-4 w-4" />
                        Send to All
                      </Button>

                      {/* Delete Button */}
                      <Button
                        onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                        disabled={deletingCouponId === coupon.id}
                      >
                        {deletingCouponId === coupon.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
