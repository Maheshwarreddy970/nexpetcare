'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPublicServicesAction } from '@/actions/store/services';
import { getCustomerPetsAction, createPetAction } from '@/actions/store/pets';
import { createBookingAction } from '@/actions/store/booking';
import { validateCouponAction, calculateDiscountAmount } from '@/actions/customer/coupon';
import { Tag, X, CheckCircle2 } from 'lucide-react';

interface Service {
    id: string;
    name: string;
    price: number;
    duration: number;
}

interface Pet {
    id: string;
    name: string;
    type: string;
    breed?: string;
    age?: number;
}

interface AppliedCoupon {
    id: string;
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
}

export default function CustomerBookingPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const store = params.store as string;
    const preSelectedService = searchParams.get('service');

    const [session, setSession] = useState<any>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showAddPet, setShowAddPet] = useState(false);
    const [message, setMessage] = useState('');

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);

    const [formData, setFormData] = useState({
        serviceId: preSelectedService || '',
        petId: '',
        bookingDate: '',
        bookingTime: '',
        notes: '',
    });

    const [petForm, setPetForm] = useState({
        name: '',
        type: 'dog',
        breed: '',
        age: '',
        gender: 'male',
    });

    useEffect(() => {
        const customerSession = localStorage.getItem('customerSession');
        if (!customerSession) {
            router.push(`/${store}/customer/login?service=${preSelectedService}`);
            return;
        }

        const customer = JSON.parse(customerSession);
        setSession(customer);
        fetchData(customer);
    }, []);

    // Recalculate discount when service changes
    useEffect(() => {
        if (appliedCoupon && formData.serviceId) {
            const selectedService = services.find((s) => s.id === formData.serviceId);
            if (selectedService) {
                calculateDiscount(selectedService.price, appliedCoupon);
            }
        }
    }, [formData.serviceId, appliedCoupon, services]);

    const fetchData = async (customer: any) => {
        try {
            const [servicesResult, petsResult] = await Promise.all([
                getPublicServicesAction(store),
                getCustomerPetsAction(customer.customerId),
            ]);

            if (servicesResult.success) {
                setServices(servicesResult.services as Service[]);
            }

            if (petsResult.success) {
                setPets(petsResult.pets as Pet[]);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const calculateDiscount = async (
        price: number,
        coupon: AppliedCoupon
    ) => {
        const discount = await calculateDiscountAmount(
            price,
            coupon.discountType,
            coupon.discountValue
        );
        setDiscountAmount(discount);
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        if (!formData.serviceId) {
            setCouponError('Please select a service first');
            return;
        }

        // ✅ Add debug log
        console.log('🎫 Applying coupon:', {
            couponCode,
            tenantId: session?.tenantId,
            sessionData: session,
        });

        if (!session?.tenantId) {
            setCouponError('Session expired. Please refresh the page.');
            return;
        }

        setCouponLoading(true);
        setCouponError('');

        const result = await validateCouponAction(session.tenantId, couponCode);

        console.log('📬 Validation result:', result);

        if (result.success && result.coupon) {
            setAppliedCoupon(result.coupon as AppliedCoupon);
            const selectedService = services.find((s) => s.id === formData.serviceId);
            if (selectedService) {
                await calculateDiscount(selectedService.price, result.coupon as AppliedCoupon);
            }
            setCouponCode('');
        } else {
            setCouponError(result.error || 'Invalid coupon code');
        }

        setCouponLoading(false);
    };


    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponCode('');
        setCouponError('');
    };

    const handleAddPet = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await createPetAction({
            customerId: session.customerId,
            tenantId: session.tenantId,
            name: petForm.name,
            type: petForm.type,
            breed: petForm.breed || undefined,
            age: petForm.age ? parseInt(petForm.age) : undefined,
            gender: petForm.gender,
        });

        if (result.success && result.pet) {
            setPets([...pets, result.pet as Pet]);
            setPetForm({ name: '', type: 'dog', breed: '', age: '', gender: 'male' });
            setShowAddPet(false);
            setFormData({ ...formData, petId: result.pet.id });
            setMessage('Pet added successfully!');
            setTimeout(() => setMessage(''), 3000);
        } else {
            setMessage(result.error || 'Failed to add pet');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.petId) {
            setMessage('Please select or add a pet');
            return;
        }

        setSubmitting(true);

        const bookingDateTime = `${formData.bookingDate}T${formData.bookingTime}:00`;

        const result = await createBookingAction({
            storeSlug: store,
            serviceId: formData.serviceId,
            customerName: session.name,
            customerEmail: session.email,
            customerPhone: session.phone,
            bookingDate: bookingDateTime,
            notes: formData.notes,
            petId: formData.petId,
            couponId: appliedCoupon?.id,
        });

        if (result.success) {
            alert('✅ Booking confirmed! Check your email for confirmation.');
            router.push(`/${store}`);
        } else {
            setMessage(result.error || 'Failed to create booking');
        }

        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const selectedService = services.find((s) => s.id === formData.serviceId);
    const today = new Date().toISOString().split('T')[0];
    const originalPrice = selectedService?.price || 0;
    const finalPrice = originalPrice - discountAmount;

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold text-center mb-8">Book Appointment</h1>

            {message && (
                <div
                    className={`mb-6 p-4 rounded-lg ${message.includes('success')
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                >
                    {message}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Service Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Service *
                        </label>
                        <select
                            value={formData.serviceId}
                            onChange={(e) =>
                                setFormData({ ...formData, serviceId: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="">Choose a service</option>
                            {services.map((service) => (
                                <option key={service.id} value={service.id}>
                                    {service.name} - ₹{(service.price / 100).toFixed(0)} ({service.duration} min)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Pet Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Select Pet *
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowAddPet(!showAddPet)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                            >
                                {showAddPet ? '✕ Close' : '+ Add New Pet'}
                            </button>
                        </div>

                        <select
                            value={formData.petId}
                            onChange={(e) =>
                                setFormData({ ...formData, petId: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="">Choose a pet</option>
                            {pets.map((pet) => (
                                <option key={pet.id} value={pet.id}>
                                    {pet.name} ({pet.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Add Pet Form */}
                    {showAddPet && (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4 border-2 border-blue-200">
                            <h3 className="font-semibold text-gray-900">Add New Pet</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    placeholder="Pet Name"
                                    value={petForm.name}
                                    onChange={(e) =>
                                        setPetForm({ ...petForm, name: e.target.value })
                                    }
                                    required
                                />

                                <select
                                    value={petForm.type}
                                    onChange={(e) =>
                                        setPetForm({ ...petForm, type: e.target.value })
                                    }
                                    className="px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="dog">🐕 Dog</option>
                                    <option value="cat">🐈 Cat</option>
                                    <option value="bird">🦜 Bird</option>
                                    <option value="rabbit">🐰 Rabbit</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    placeholder="Breed (Optional)"
                                    value={petForm.breed}
                                    onChange={(e) =>
                                        setPetForm({ ...petForm, breed: e.target.value })
                                    }
                                />

                                <Input
                                    type="number"
                                    placeholder="Age (years)"
                                    value={petForm.age}
                                    onChange={(e) =>
                                        setPetForm({ ...petForm, age: e.target.value })
                                    }
                                />

                                <select
                                    value={petForm.gender}
                                    onChange={(e) =>
                                        setPetForm({ ...petForm, gender: e.target.value })
                                    }
                                    className="px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>

                            <Button
                                type="button"
                                onClick={handleAddPet}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                Add Pet
                            </Button>
                        </div>
                    )}

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preferred Date *
                            </label>
                            <Input
                                type="date"
                                value={formData.bookingDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, bookingDate: e.target.value })
                                }
                                min={today}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preferred Time *
                            </label>
                            <Input
                                type="time"
                                value={formData.bookingTime}
                                onChange={(e) =>
                                    setFormData({ ...formData, bookingTime: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>

                    {/* Coupon Code Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border-2 border-purple-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Tag className="h-5 w-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Have a coupon code?</h3>
                        </div>

                        {!appliedCoupon ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value.toUpperCase());
                                            setCouponError('');
                                        }}
                                        placeholder="Enter coupon code"
                                        className="flex-1 uppercase"
                                        disabled={!formData.serviceId}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        disabled={couponLoading || !formData.serviceId}
                                        className="bg-purple-600 hover:bg-purple-700 px-6"
                                    >
                                        {couponLoading ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            'Apply'
                                        )}
                                    </Button>
                                </div>

                                {couponError && (
                                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                        <X className="h-4 w-4" />
                                        {couponError}
                                    </div>
                                )}

                                {!formData.serviceId && (
                                    <p className="text-xs text-gray-500">
                                        Please select a service to apply coupon
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            <span className="font-bold text-green-700">
                                                {appliedCoupon.code}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {appliedCoupon.description}
                                        </p>
                                        <p className="text-sm font-semibold text-green-600">
                                            You save: ₹{(discountAmount / 100).toFixed(0)}
                                            {appliedCoupon.discountType === 'percentage' &&
                                                ` (${appliedCoupon.discountValue}% off)`
                                            }
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveCoupon}
                                        className="text-gray-400 hover:text-red-600 p-1"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Requests
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                            placeholder="Any special requests or notes about your pet..."
                        />
                    </div>

                    {/* Summary */}
                    {selectedService && (
                        <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                            <h3 className="font-bold text-gray-900 mb-3">Booking Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Service:</span>
                                    <span className="font-medium">{selectedService.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Duration:</span>
                                    <span className="font-medium">{selectedService.duration} minutes</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Date:</span>
                                    <span className="font-medium">
                                        {formData.bookingDate
                                            ? new Date(formData.bookingDate).toLocaleDateString('en-IN', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })
                                            : 'Not selected'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Time:</span>
                                    <span className="font-medium">{formData.bookingTime || 'Not selected'}</span>
                                </div>

                                <div className="border-t pt-3 mt-3 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Original Price:</span>
                                        <span className={appliedCoupon ? 'line-through text-gray-400' : 'font-medium'}>
                                            ₹{(originalPrice / 100).toFixed(0)}
                                        </span>
                                    </div>

                                    {appliedCoupon && (
                                        <>
                                            <div className="flex justify-between text-green-600">
                                                <span className="font-medium">Discount ({appliedCoupon.code}):</span>
                                                <span className="font-medium">
                                                    - ₹{(discountAmount / 100).toFixed(0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="font-bold text-lg">Final Price:</span>
                                                <span className="text-xl font-bold text-blue-600">
                                                    ₹{(finalPrice / 100).toFixed(0)}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {!appliedCoupon && (
                                        <div className="flex justify-between">
                                            <span className="font-bold">Total:</span>
                                            <span className="text-lg font-bold text-blue-600">
                                                ₹{(originalPrice / 100).toFixed(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={submitting || !formData.petId}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 font-semibold"
                    >
                        {submitting ? '⏳ Processing...' : '✓ Confirm Booking'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
