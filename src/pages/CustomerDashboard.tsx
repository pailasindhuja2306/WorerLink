import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { Worker, Booking, District, Category, Profession } from '../types';
import { districts, categories, professions, skillsByCategory } from '../data/mockData';
import { Search, Filter, MapPin, Star, Clock, LogOut, User, Calendar, CheckCircle, XCircle, AlertCircle, RefreshCw, Navigation, Map } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    task: '',
    description: '',
    scheduledDate: '',
    estimatedDuration: 1,
  });
  const [filters, setFilters] = useState({
    profession: '',
    district: '',
    category: '',
    maxRate: '',
  });
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings'>('browse');
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const [reviewForms, setReviewForms] = useState<Record<string, { rating: number; comment: string }>>({});

  useEffect(() => {
    loadData();
    // Set up interval to refresh data every 5 seconds to catch new workers
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [workers, filters]);

  const loadData = () => {
    // Force refresh from localStorage
    const allWorkers = storage.getWorkers();
    const userBookings = storage.getBookings().filter(booking => booking.customerId === user?.id);
    setWorkers(allWorkers);
    setBookings(userBookings);
    console.log('Loaded workers:', allWorkers.length); // Debug log
  };

  // Location sharing functions
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Get address from coordinates (simplified - in real app, use reverse geocoding API)
          const address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;

          resolve({ latitude, longitude, address });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const enableLocationSharing = async () => {
    try {
      const location = await getCurrentLocation();

      if (user) {
        // Update user's location
        const updatedUser = {
          ...user,
          currentLocation: {
            ...location,
            lastUpdated: new Date()
          },
          locationSharingEnabled: true
        };

        storage.updateUser(user.id, updatedUser);
        setLocationSharingEnabled(true);

        // Update all bookings with live location sharing
        const userBookings = storage.getBookings().filter(booking => booking.customerId === user.id);
        userBookings.forEach(booking => {
          if (booking.contactDetailsShared) {
            storage.updateBooking(booking.id, {
              liveLocationSharing: {
                enabled: true,
                customerLocation: {
                  ...location,
                  lastUpdated: new Date()
                },
                workerLocation: booking.liveLocationSharing?.workerLocation
              }
            });
          }
        });

        loadData();
        alert('📍 Live location sharing enabled! Your location will be shared with assigned workers.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('❌ Could not access your location. Please allow location permissions and try again.');
    }
  };

  const disableLocationSharing = () => {
    if (user) {
      storage.updateUser(user.id, { locationSharingEnabled: false });
      setLocationSharingEnabled(false);

      // Disable live location sharing for all bookings
      const userBookings = storage.getBookings().filter(booking => booking.customerId === user.id);
      userBookings.forEach(booking => {
        if (booking.liveLocationSharing?.enabled) {
          storage.updateBooking(booking.id, {
            liveLocationSharing: {
              ...booking.liveLocationSharing,
              enabled: false
            }
          });
        }
      });

      loadData();
      alert('📍 Live location sharing disabled.');
    }
  };

  const applyFilters = () => {
    let filtered = workers.filter(worker => worker.availability === 'available');

    if (filters.profession) {
      filtered = filtered.filter(worker => worker.profession === filters.profession);
    }

    if (filters.district) {
      filtered = filtered.filter(worker => worker.district === filters.district);
    }

    if (filters.category) {
      filtered = filtered.filter(worker => worker.category === filters.category);
    }

    // removed women-only filtering

    if (filters.maxRate) {
      filtered = filtered.filter(worker => worker.hourlyRate <= Number(filters.maxRate));
    }

    setFilteredWorkers(filtered);
  };

  const setReviewFormField = (bookingId: string, updates: Partial<{ rating: number; comment: string }>) => {
    setReviewForms(prev => ({
      ...prev,
      [bookingId]: {
        rating: updates.rating ?? prev[bookingId]?.rating ?? 0,
        comment: updates.comment ?? prev[bookingId]?.comment ?? '',
      }
    }));
  };

  const computeAverageRating = (ratings: number[]): number => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, n) => acc + n, 0);
    return parseFloat((sum / ratings.length).toFixed(1));
  };

  const handleSubmitReview = (bookingId: string) => {
    const booking = storage.getBookings().find(b => b.id === bookingId);
    if (!booking || !booking.workerId || !user) return;

    const worker = storage.getWorkers().find(w => w.id === booking.workerId);
    const form = reviewForms[bookingId];
    if (!worker || !form || form.rating < 1 || form.rating > 5) {
      alert('Please select a rating between 1 and 5');
      return;
    }

    const newReview = {
      id: Date.now().toString(),
      workerId: worker.id,
      customerId: user.id,
      bookingId: booking.id,
      rating: form.rating,
      comment: (form.comment || '').trim(),
      createdAt: new Date(),
    };

    const existingReviews = worker.reviews || [];
    const updatedReviews = [...existingReviews, newReview];
    const newAvg = computeAverageRating(updatedReviews.map(r => r.rating));

    storage.updateWorker(worker.id, {
      reviews: updatedReviews as any,
      rating: newAvg,
    });

    // Optional: mark as reviewed on booking for quick checks (not strictly needed)
    storage.updateBooking(booking.id, { adminNotes: (booking.adminNotes || '') });

    // Refresh and reset
    loadData();
    setReviewFormField(bookingId, { rating: 0, comment: '' });
    alert('Thank you for your feedback!');
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleBookWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || !user) return;

    const newBooking: Booking = {
      id: Date.now().toString(),
      customerId: user.id,
      // assign directly to the selected worker (direct connection)
      workerId: selectedWorker.id,
      task: bookingForm.task,
      description: bookingForm.description,
      scheduledDate: new Date(bookingForm.scheduledDate),
      estimatedDuration: bookingForm.estimatedDuration,
      status: 'worker_assigned', // assigned directly to worker
      paymentMethod: 'cash',
      totalAmount: selectedWorker.hourlyRate * bookingForm.estimatedDuration,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      location: {
        address: user.currentLocation?.address || 'Customer Address',
        district: districts.find(d => d.id === user.district)?.name || 'Unknown',
        latitude: user.currentLocation?.latitude,
        longitude: user.currentLocation?.longitude,
      },
      // Share contact details immediately to enable direct connection
      contactDetailsShared: true,
    };

    storage.addBooking(newBooking);

    // Notify worker about the new booking
    const workerNotification = {
      id: Date.now().toString() + '_worker_booking',
      userId: selectedWorker.id,
      title: 'New Booking Assigned',
      message: `You have a new booking: ${newBooking.task} on ${newBooking.scheduledDate.toLocaleString()}`,
      type: 'booking' as const,
      isRead: false,
      createdAt: new Date(),
      bookingId: newBooking.id,
    };

    // Optional: notify customer as confirmation
    const customerNotification = {
      id: Date.now().toString() + '_customer_booking',
      userId: user.id,
      title: 'Booking Confirmed',
      message: `Your booking for ${newBooking.task} has been sent to ${selectedWorker.name}.`,
      type: 'booking' as const,
      isRead: false,
      createdAt: new Date(),
      bookingId: newBooking.id,
    };

    storage.addNotification(workerNotification);
    storage.addNotification(customerNotification);
    loadData();
    setShowBookingForm(false);
    setSelectedWorker(null);
    setBookingForm({
      task: '',
      description: '',
      scheduledDate: '',
      estimatedDuration: 1,
    });
  };

  const getStatusIcon = (status: string, contactDetailsShared?: boolean) => {
    if (contactDetailsShared) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    switch (status) {
      case 'pending_admin':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'admin_verified':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'worker_assigned':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string, contactDetailsShared?: boolean) => {
    if (contactDetailsShared) {
      return 'bg-green-100 text-green-800';
    }
    switch (status) {
      case 'pending_admin':
        return 'bg-orange-100 text-orange-800';
      case 'admin_verified':
        return 'bg-blue-100 text-blue-800';
      case 'worker_assigned':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancel = (status: string, contactDetailsShared?: boolean) => {
    // Allow cancellation after admin verification or once contact details are shared/worker assigned/accepted/in_progress
    const cancellableStatuses = ['admin_verified', 'worker_assigned', 'accepted', 'in_progress'];
    return !!contactDetailsShared || cancellableStatuses.includes(status);
  };

  const handleCancelBooking = (bookingId: string) => {
    const booking = storage.getBookings().find(b => b.id === bookingId);
    if (!booking) return;

    const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmCancel) return;

    // Disable live sharing and clear contact sharing
    storage.updateBooking(bookingId, {
      status: 'cancelled',
      contactDetailsShared: false,
      liveLocationSharing: {
        ...booking.liveLocationSharing,
        enabled: false,
      }
    });

    // Notify worker and customer
    const customerNotification = {
      id: Date.now().toString() + '_customer_cancel',
      userId: booking.customerId,
      title: 'Booking Cancelled',
      message: `You cancelled the booking "${booking.task}".`,
      type: 'booking' as const,
      isRead: false,
      createdAt: new Date(),
      bookingId: bookingId,
    };

    const workerNotification = {
      id: Date.now().toString() + '_worker_cancel',
      userId: booking.workerId || '',
      title: 'Booking Cancelled',
      message: `The booking "${booking.task}" was cancelled by the customer.`,
      type: 'booking' as const,
      isRead: false,
      createdAt: new Date(),
      bookingId: bookingId,
    };

    storage.addNotification(customerNotification);
    if (booking.workerId) storage.addNotification(workerNotification);

    loadData();
    alert('Booking cancelled successfully.');
  };

  const getWorkerSkills = (worker: Worker) => {
    const selectedProfession = professions.find(p => p.name === worker.profession);
    if (selectedProfession) {
      const availableSkills = skillsByCategory[selectedProfession.category] || [];
      // Show only skills that the worker has selected
      return worker.skills.filter(skill => availableSkills.includes(skill));
    }
    return worker.skills;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">{t('app.title')}</h1>
              <span className="ml-4 text-sm text-gray-500">{t('header.customer')}</span>
                <button
                  onClick={loadData}
                  className="ml-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Refresh workers list"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={locationSharingEnabled ? disableLocationSharing : enableLocationSharing}
                  className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${locationSharingEnabled
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Map className="h-4 w-4 mr-1" />
                  {locationSharingEnabled ? t('btn.share_location_on') : t('btn.share_location_off')}
                </button>
              </div>
              <span className="text-sm text-gray-700">{t('header.welcome')}, {user?.username ? `@${user.username}` : user?.name}</span>
              <button
                onClick={logout}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                {t('btn.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="mb-6">
            <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'browse'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t('tab.browse')}
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t('tab.bookings')} ({bookings.length})
            </button>
          </nav>
        </div>

        {activeTab === 'browse' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center mb-4">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">{t('btn.refresh') /* reuse a label for now */}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profession
                  </label>
                  <select
                    value={filters.profession}
                    onChange={(e) => handleFilterChange('profession', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">All Professions</option>
                    {professions.map(profession => (
                      <option key={profession.id} value={profession.name}>
                        {profession.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <select
                    value={filters.district}
                    onChange={(e) => handleFilterChange('district', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">All Districts</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Rate (₹/hr)
                  </label>
                  <input
                    type="number"
                    value={filters.maxRate}
                    onChange={(e) => handleFilterChange('maxRate', e.target.value)}
                    placeholder="No limit"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div />
              </div>
            </div>

            {/* Workers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map(worker => (
                <div key={worker.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-gray-900">{worker.name}</h3>
                          <p className="text-sm text-gray-500">{worker.profession}</p>
                        </div>
                      </div>
                      {/* removed women-only badge */}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {districts.find(d => d.id === worker.district)?.name}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-2" />
                        {worker.rating} ({worker.totalJobs} jobs)
                      </div>
                      <div className="text-sm text-gray-600">
                        ₹{worker.hourlyRate}/hour
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{worker.bio}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {getWorkerSkills(worker).slice(0, 3).map(skill => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {getWorkerSkills(worker).length > 3 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{getWorkerSkills(worker).length - 3} more
                        </span>
                      )}
                    </div>

                      <button
                        onClick={() => handleBookWorker(worker)}
                        className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                      >
                        {t('btn.book_now')}
                      </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredWorkers.length === 0 && (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('no_workers')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('search.adjust_filters')}
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.map(booking => {
              const worker = workers.find(w => w.id === booking.workerId);
              return (
                <div key={booking.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{booking.task}</h3>
                        <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status, booking.contactDetailsShared)}`}>
                          {getStatusIcon(booking.status, booking.contactDetailsShared)}
                          <span className="ml-1 capitalize">
                            {booking.contactDetailsShared ? 'Contact Shared' : booking.status.replace('_', ' ')}
                          </span>
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{booking.description}</p>

                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {worker?.name || 'Unknown Worker'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {booking.estimatedDuration} hours
                        </div>
                        <div className="font-medium text-gray-900">
                          ₹{booking.totalAmount}
                        </div>
                      </div>

                      {/* Contact Details Section */}
                      {booking.contactDetailsShared && worker && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {t('contact.worker_details_title')}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-blue-700 font-medium">Name:</span>
                              <span className="ml-2 text-blue-900">{worker.name}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-medium">Phone:</span>
                              <span className="ml-2 text-blue-900 font-mono">{worker.phone}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-medium">Email:</span>
                              <span className="ml-2 text-blue-900">{worker.email}</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-medium">Rate:</span>
                              <span className="ml-2 text-blue-900">₹{worker.hourlyRate}/hour</span>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                            💡 After admin verification, you now have the worker's contact details. You can call them directly to coordinate the job.
                          </div>

                          {/* Live Location Sharing */}
                          {booking.liveLocationSharing?.enabled && (
                            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <h6 className="font-medium text-purple-900 mb-2 flex items-center">
                                <Navigation className="h-4 w-4 mr-2" />
                                {t('live_location.title')}
                              </h6>

                              {booking.liveLocationSharing.customerLocation && (
                                <div className="text-sm text-purple-700 mb-2">
                                  <strong>{t('live_location.your_location')}</strong> {booking.liveLocationSharing.customerLocation.address}
                                  <span className="text-xs text-purple-600 ml-2">
                                    (Updated: {new Date(booking.liveLocationSharing.customerLocation.lastUpdated).toLocaleTimeString()})
                                  </span>
                                </div>
                              )}

                              {booking.liveLocationSharing.workerLocation && (
                                <div className="text-sm text-purple-700">
                                  <strong>{t('live_location.worker_location')}</strong> {booking.liveLocationSharing.workerLocation.address}
                                  <span className="text-xs text-purple-600 ml-2">
                                    (Updated: {new Date(booking.liveLocationSharing.workerLocation.lastUpdated).toLocaleTimeString()})
                                  </span>
                                </div>
                              )}

                              <div className="mt-2 text-xs text-purple-600 bg-purple-100 p-2 rounded">
                                {t('live_location.both_visible')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Cancel booking (customer) */}
                      {canCancel(booking.status, booking.contactDetailsShared) && (
                        <div className="mt-4">
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            {t('btn.cancel_booking')}
                          </button>
                        </div>
                      )}

                      {/* Review section for completed bookings */}
                      {booking.status === 'completed' && worker && (
                        <div className="mt-6 border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">{t('review.leave_rating')}</h4>
                          {(() => {
                            const alreadyReviewed = (worker.reviews || []).some(r => r.bookingId === booking.id && r.customerId === user?.id);
                            if (alreadyReviewed) {
                              return (
                                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
                                  {t('review.thank_you')}
                                </div>
                              );
                            }
                            const current = reviewForms[booking.id] || { rating: 0, comment: '' };
                            return (
                              <div>
                                <div className="flex items-center space-x-1 mb-2">
                                  {[1,2,3,4,5].map(n => (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => setReviewFormField(booking.id, { rating: n })}
                                      className={`p-1 rounded ${current.rating >= n ? 'text-yellow-500' : 'text-gray-300'}`}
                                      aria-label={`Rate ${n}`}
                                    >
                                      <Star className="h-5 w-5" fill={current.rating >= n ? '#F59E0B' : 'none'} />
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  rows={3}
                                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  value={current.comment}
                                  onChange={(e) => setReviewFormField(booking.id, { comment: e.target.value })}
                                  placeholder={t('review.comment_placeholder')}
                                />
                                <div className="mt-3">
                                  <button
                                    onClick={() => handleSubmitReview(booking.id)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                  >
                                    {t('review.submit')}
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {bookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('booking.no_bookings')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('booking.start_browsing')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingForm && selectedWorker && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Book {selectedWorker.name}
              </h3>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={bookingForm.task}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, task: e.target.value }))}
                    placeholder="e.g., House Cleaning"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the work needed..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={bookingForm.scheduledDate}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={bookingForm.estimatedDuration}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, estimatedDuration: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                {/* removed women-only option */}

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span>Rate: ₹{selectedWorker.hourlyRate}/hour</span>
                    <span>Duration: {bookingForm.estimatedDuration} hours</span>
                    <span className="font-medium">Total: ₹{selectedWorker.hourlyRate * bookingForm.estimatedDuration}</span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
