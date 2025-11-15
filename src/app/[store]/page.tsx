'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTenantBySlugAction } from '@/actions/store/tenant';
import { getPublicServicesAction } from '@/actions/store/services';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const store = params.store as string;

  const [tenant, setTenant] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store === 'admin') {
      router.push(`/${store}/login`);
      return;
    }
    fetchData();
  }, [store]);

  const fetchData = async () => {
    const [tenantResult, servicesResult] = await Promise.all([
      getTenantBySlugAction(store),
      getPublicServicesAction(store),
    ]);

    if (tenantResult.success) {
      setTenant(tenantResult.tenant);
    }

    if (servicesResult.success) {
      setServices(servicesResult.services as Service[]);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const websiteData = tenant?.websiteData || {};
  const hero = websiteData.hero || {};

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {hero.title || `Welcome to ${tenant?.name}`}
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              {hero.subtitle || 'Premium pet care services'}
            </p>
            <Link
              href={`/${store}/bookings`}
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
<section className="py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((service) => (
        <div key={service.id} className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-2">{service.name}</h3>
          <p className="text-gray-600 mb-4">{service.description}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                ₹{(service.price / 100).toFixed(0)}
              </p>
              <p className="text-sm text-gray-500">{service.duration} minutes</p>
            </div>
            <Link
              href={`/${store}/services/${service.name}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              View Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* About Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">About Us</h2>
            <p className="text-lg text-gray-700">
              {websiteData.about || 'We provide the best care for your pets.'}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Schedule your appointment today and give your pet the care they deserve
          </p>
          <Link
            href={`/${store}/bookings`}
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700"
          >
            Book Appointment Now
          </Link>
        </div>
      </section>
    </div>
  );
}
