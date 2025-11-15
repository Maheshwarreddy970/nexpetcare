'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getServiceBySlugAction } from '@/actions/store/services';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  images: string[];
}

export default function ServiceDetailPage() {
  const params =  useParams();
  const router = useRouter();
  const store = params.store as string;
  const serviceSlug = params.serviceSlug as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchService();
  }, [serviceSlug]);

  const fetchService = async () => {
    const result = await getServiceBySlugAction(store, serviceSlug);

    if (result.success) {
      setService(result.service as Service);
    } else {
      setNotFound(true);
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

  if (notFound || !service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h1>
          <p className="text-gray-600 mb-8">This service doesn't exist.</p>
          <Link
            href={`/${store}/services`}
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  const customerSession = localStorage.getItem('customerSession');

  const handleBookNow = () => {
    if (!customerSession) {
      router.push(`/${store}/customer/login?redirect=booking&service=${service.id}`);
    } else {
      router.push(`/${store}/customer/booking?service=${service.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link href={`/${store}/services`} className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
        ← Back to Services
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <div>
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-96 rounded-lg flex items-center justify-center">
            {service.images.length > 0 ? (
              <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl">🐕</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{service.name}</h1>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600">Price</p>
                <p className="text-3xl font-bold text-blue-600">
                  ₹{(service.price / 100).toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="text-3xl font-bold text-gray-900">
                  {service.duration} <span className="text-lg">min</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">About This Service</h2>
            <p className="text-gray-700 leading-relaxed">{service.description}</p>
          </div>

          <div className="space-y-3 mb-8">
            <h3 className="font-bold">What's Included:</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Professional service</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>{service.duration} minutes</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Expert care</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleBookNow}
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-4"
          >
            Book This Service
          </Button>
        </div>
      </div>
    </div>
  );
}
