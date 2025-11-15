'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPublicServicesAction } from '@/actions/store/services';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  duration: number;
}

export default function ServicesPage() {
  const params = useParams();
  const store = params.store as string;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const result = await getPublicServicesAction(store);
    if (result.success) {
      setServices(result.services as Service[]);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-center mb-12">Our Services</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
            <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    ₹{(service.price / 100).toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-500">{service.duration} minutes</p>
                </div>
              </div>
              <Link
                href={`/${store}/services/${service.slug}`}
                className="block w-full bg-blue-600 text-white text-center px-4 py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No services available at the moment.</p>
        </div>
      )}
    </div>
  );
}
