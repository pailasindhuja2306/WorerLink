import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { Worker, Booking } from '../types';
import { districts, categories, professions, skillsByCategory, mandals } from '../data/mockData';
import { Search, Filter, MapPin, Star, Clock, LogOut, User, Calendar, CheckCircle, XCircle, AlertCircle, RefreshCw, Navigation, Map, Phone, Shield, Info, CreditCard, Building2, Banknote, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Company proxy number for privacy-protected communication
const COMPANY_PROXY_NUMBER = '+91-9876-543210';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    task: '',
    description: '',
    taskDescription: '',
    scheduledDate: '',
    estimatedDuration: 1,
    beforeTaskPhoto: null as File | null,
  });
  const [filters, setFilters] = useState({
    profession: '',
    mandal: '',
    category: '',
    maxRate: '',
  });
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings'>('browse');
  const [bookingsSubTab, setBookingsSubTab] = useState<'active' | 'completed'>('active');
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const [locationPreference, setLocationPreference] = useState<'current' | 'registered'>('registered');
  const [showLocationMenu, setShowLocationMenu] = useState(false);
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
    // Filter to show only approved workers to customers
    const approvedWorkers = allWorkers.filter(w => w.approvalStatus === 'approved');
    const userBookings = storage.getBookings().filter(booking => booking.customerId === user?.id);
    setWorkers(approvedWorkers);
    setBookings(userBookings);
    console.log('Loaded approved workers:', approvedWorkers.length, 'out of', allWorkers.length); // Debug log
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
      let location: {
        latitude: number;
        longitude: number;
        address: string;
      };

      if (locationPreference === 'current') {
        // Get current GPS location
        location = await getCurrentLocation();
      } else {
        // Use registered profile location
        if (!user?.currentLocation) {
          alert('❌ No registered location found in your profile. Please update your profile or use current location.');
          return;
        }
        location = {
          latitude: user.currentLocation.latitude,
          longitude: user.currentLocation.longitude,
          address: user.currentLocation.address
        };
      }

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
        const locationType = locationPreference === 'current' ? 'current GPS location' : 'registered location';
        alert(`📍 Location sharing enabled! Your ${locationType} will be shared with assigned workers.`);
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

    if (filters.mandal) {
      filtered = filtered.filter(worker => worker.district === filters.mandal);
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
    setBookingStep(1);
    setSelectedPaymentMethod('');
    setShowBookingForm(true);
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        alert('Only JPEG and PNG images are allowed');
        e.target.value = '';
        return;
      }
      setBookingForm(prev => ({ ...prev, beforeTaskPhoto: file }));
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || !user) return;

    // Advance to Step 2 (payment selection)
    setBookingStep(2);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedWorker || !user || !selectedPaymentMethod) return;

    // Start payment processing
    setIsProcessingPayment(true);

    // Simulate payment processing delay (2.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    let beforeTaskPhotoData = undefined;

    // Convert photo to base64 if uploaded
    if (bookingForm.beforeTaskPhoto) {
      try {
        const base64 = await fileToBase64(bookingForm.beforeTaskPhoto);
        beforeTaskPhotoData = {
          url: base64,
          uploadedAt: new Date(),
          uploadedBy: user.id,
          fileName: bookingForm.beforeTaskPhoto.name,
          fileSize: bookingForm.beforeTaskPhoto.size,
        };
      } catch (error) {
        console.error('Error converting photo:', error);
        alert('Failed to upload photo. Please try again.');
        return;
      }
    }

    const currentTime = new Date();
    const responseDeadline = new Date(currentTime.getTime() + 15 * 60 * 1000); // 15 minutes from now

    const newBooking: Booking = {
      id: Date.now().toString(),
      customerId: user.id,
      // assign directly to the selected worker (direct connection)
      workerId: selectedWorker.id,
      task: bookingForm.task,
      description: bookingForm.description,
      taskDescription: bookingForm.taskDescription || undefined,
      scheduledDate: new Date(bookingForm.scheduledDate),
      estimatedDuration: bookingForm.estimatedDuration,
      status: 'worker_assigned', // assigned directly to worker
      paymentMethod: selectedPaymentMethod,
      totalAmount: selectedWorker.hourlyRate * bookingForm.estimatedDuration,
      createdAt: new Date(),
      updatedAt: new Date(),
      responseDeadline: responseDeadline, // Worker must respond within 15 minutes
      remindersSent: {
        oneHour: false,
        thirtyMin: false,
      },

      location: {
        address: user.currentLocation?.address || 'Customer Address',
        district: districts.find(d => d.id === user.district)?.name || 'Unknown',
        latitude: user.currentLocation?.latitude,
        longitude: user.currentLocation?.longitude,
      },
      // Share contact details immediately to enable direct connection
      contactDetailsShared: true,
      // Add photos if uploaded
      photos: beforeTaskPhotoData ? {
        beforeTask: beforeTaskPhotoData,
      } : undefined,
      // Add company proxy number for privacy-protected communication
      companyProxyNumber: COMPANY_PROXY_NUMBER,
    };

    storage.addBooking(newBooking);

    // Notify worker about the new booking with urgency
    const workerNotification = {
      id: Date.now().toString() + '_worker_booking',
      userId: selectedWorker.id,
      title: '⚡ Urgent: New Booking Request',
      message: `You have a new booking: "${newBooking.task}" scheduled for ${newBooking.scheduledDate.toLocaleString()}. Please accept or reject within 15 minutes!`,
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

    // Close booking modal, reset states, and show success toast
    setIsProcessingPayment(false);
    setShowBookingForm(false);
    setBookingStep(1);
    setShowSuccessToast(true);

    // Auto-dismiss toast after 4 seconds
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);

    loadData();
    setSelectedWorker(null);
    setSelectedPaymentMethod('');
    setBookingForm({
      task: '',
      description: '',
      taskDescription: '',
      scheduledDate: '',
      estimatedDuration: 1,
      beforeTaskPhoto: null,
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
      <header className="bg-gradient-to-r from-primary-700 to-primary-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-5 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold text-white drop-shadow-md truncate">{t('app.title')}</h1>
              <span className="hidden sm:inline px-3 py-1 bg-accent-500 rounded-full text-xs sm:text-sm text-white font-semibold shadow-lg">{t('header.customer')}</span>
              <button
                onClick={loadData}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0"
                title="Refresh workers list"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="flex items-center space-x-1 sm:space-x-2 relative">
                {/* Location Sharing Toggle Button */}
                <button
                  onClick={locationSharingEnabled ? disableLocationSharing : enableLocationSharing}
                  className={`flex items-center px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap min-h-10 ${locationSharingEnabled
                    ? 'bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 text-white hover:from-primary-600 hover:via-accent-500 hover:to-accent-600 shadow-lg'
                    : 'bg-white/90 text-primary-700 hover:bg-white'
                    }`}
                >
                  <Map className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="hidden sm:inline">{locationSharingEnabled ? t('btn.share_location_on') : t('btn.share_location_off')}</span>
                  <span className="sm:hidden">{locationSharingEnabled ? 'On' : 'Off'}</span>
                </button>

                {/* Location Preference Selector */}
                {!locationSharingEnabled && (
                  <div className="relative">
                    <button
                      onClick={() => setShowLocationMenu(!showLocationMenu)}
                      className="flex items-center px-3 py-2 bg-white/90 text-primary-700 rounded-lg text-sm font-medium hover:bg-white transition-all duration-200 shadow-sm border border-primary-200"
                      title="Choose location type"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-xs">
                        {locationPreference === 'current' ? 'GPS' : 'Registered'}
                      </span>
                      <svg className="h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showLocationMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in">
                        <div className="p-2">
                          <p className="text-xs font-semibold text-gray-700 px-3 py-2">Choose Location Type</p>

                          {/* Current GPS Location Option */}
                          <button
                            onClick={() => {
                              setLocationPreference('current');
                              setShowLocationMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-200 ${locationPreference === 'current'
                                ? 'bg-primary-50 text-primary-700 border border-primary-300'
                                : 'hover:bg-gray-50 text-gray-700'
                              }`}
                          >
                            <div className="flex items-start">
                              <Navigation className={`h-5 w-5 mr-3 mt-0.5 ${locationPreference === 'current' ? 'text-primary-600' : 'text-gray-500'}`} />
                              <div className="flex-1">
                                <div className="font-medium text-sm">Current GPS Location</div>
                                <div className="text-xs text-gray-600 mt-0.5">Share real-time location from device</div>
                              </div>
                              {locationPreference === 'current' && (
                                <CheckCircle className="h-5 w-5 text-primary-600" />
                              )}
                            </div>
                          </button>

                          {/* Registered Location Option */}
                          <button
                            onClick={() => {
                              setLocationPreference('registered');
                              setShowLocationMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-200 mt-1 ${locationPreference === 'registered'
                                ? 'bg-primary-50 text-primary-700 border border-primary-300'
                                : 'hover:bg-gray-50 text-gray-700'
                              }`}
                          >
                            <div className="flex items-start">
                              <User className={`h-5 w-5 mr-3 mt-0.5 ${locationPreference === 'registered' ? 'text-primary-600' : 'text-gray-500'}`} />
                              <div className="flex-1">
                                <div className="font-medium text-sm">Registered Location</div>
                                <div className="text-xs text-gray-600 mt-0.5">Use address from profile</div>
                              </div>
                              {locationPreference === 'registered' && (
                                <CheckCircle className="h-5 w-5 text-primary-600" />
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-xs sm:text-sm text-white font-medium hidden sm:inline">{t('header.welcome')}, {user?.username ? `@${user.username}` : user?.name}</span>
              <button
                onClick={logout}
                className="flex items-center px-2 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 min-h-10"
              >
                <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t('btn.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-2 bg-white rounded-lg shadow-soft p-1">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 py-3 px-6 font-semibold text-sm rounded-md transition-all duration-200 ${activeTab === 'browse'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {t('tab.browse')}
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 py-3 px-6 font-semibold text-sm rounded-md transition-all duration-200 ${activeTab === 'bookings'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {t('tab.bookings')} <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{bookings.length}</span>
            </button>
          </nav>
        </div>

        {activeTab === 'browse' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 sm:p-6 mb-6">
              <div className="flex items-center mb-4 sm:mb-5">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg mr-2 sm:mr-3 shadow-sm">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filter Workers</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
                    Mandal
                  </label>
                  <select
                    value={filters.mandal}
                    onChange={(e) => handleFilterChange('mandal', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">All Mandals</option>
                    {mandals.map(mandal => (
                      <option key={mandal.id} value={mandal.id}>
                        {mandal.name}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredWorkers.map((worker, index) => {
                const colorClasses = [
                  'from-primary-500 to-primary-600',
                  'from-customer-500 to-customer-600',
                  'from-accent-500 to-accent-600',
                  'from-worker-500 to-worker-600',
                  'from-admin-500 to-admin-600',
                  'from-info-500 to-info-600',
                ];
                const colorClass = colorClasses[index % colorClasses.length];

                return (
                  <div key={worker.id} className="bg-white rounded-xl shadow-soft border border-gray-100 hover:shadow-medium hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`h-14 w-14 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
                            <User className="h-7 w-7 text-white" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900">{worker.name}</h3>
                            <p className="text-sm text-gray-600 font-medium">{worker.profession}</p>
                          </div>
                        </div>
                        {/* removed women-only badge */}
                      </div>

                      <div className="space-y-2.5 mb-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <div className="p-1.5 bg-gray-100 rounded-md mr-2">
                            <MapPin className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                          <span className="font-medium">{districts.find(d => d.id === worker.district)?.name}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="p-1.5 bg-warning-100 rounded-md mr-2">
                            <Star className="h-3.5 w-3.5 text-warning-600 fill-warning-600" />
                          </div>
                          <span className="font-semibold text-gray-900">{worker.rating}</span>
                          <span className="ml-1 text-gray-600">({(worker.reviews || []).length} reviews)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="px-3 py-1.5 bg-accent-50 border border-accent-200 rounded-lg">
                            <span className="text-sm font-bold text-accent-700">₹{worker.hourlyRate}</span>
                            <span className="text-xs text-accent-600 ml-1">/hour</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed mb-4">{worker.bio}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
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
                        className="w-full bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 text-white py-3 px-4 rounded-xl hover:from-primary-600 hover:via-accent-500 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        {t('btn.book_now')}
                      </button>
                    </div>
                  </div>
                );
              })}
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
            {/* Sub-tabs for Active and Completed Bookings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4 overflow-x-auto">
              <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200 min-w-min">
                <button
                  onClick={() => setBookingsSubTab('active')}
                  className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-6 font-semibold text-xs sm:text-sm rounded-t-md transition-all duration-200 whitespace-nowrap min-w-max sm:min-w-0 ${bookingsSubTab === 'active'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <span className="hidden sm:inline">Active Bookings</span>
                  <span className="sm:hidden">Active</span>
                  <span className="ml-1 px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full text-xs inline-block">
                    {bookings.filter(b => ['pending_admin', 'admin_verified', 'worker_assigned', 'accepted', 'in_progress'].includes(b.status)).length}
                  </span>
                </button>
                <button
                  onClick={() => setBookingsSubTab('completed')}
                  className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-6 font-semibold text-xs sm:text-sm rounded-t-md transition-all duration-200 whitespace-nowrap min-w-max sm:min-w-0 ${bookingsSubTab === 'completed'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <span className="hidden sm:inline">Completed Bookings</span>
                  <span className="sm:hidden">Completed</span>
                  <span className="ml-1 px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full text-xs inline-block">
                    {bookings.filter(b => ['completed', 'cancelled'].includes(b.status)).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Filtered Bookings List */}
            {bookings
              .filter(booking => {
                if (bookingsSubTab === 'active') {
                  return ['pending_admin', 'admin_verified', 'worker_assigned', 'accepted', 'in_progress'].includes(booking.status);
                } else {
                  return ['completed', 'cancelled'].includes(booking.status);
                }
              })
              .map(booking => {
                const worker = workers.find(w => w.id === booking.workerId);
                return (
                  <div key={booking.id} className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 break-words">{booking.task}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(booking.status, booking.contactDetailsShared)}`}>
                            {getStatusIcon(booking.status, booking.contactDetailsShared)}
                            <span className="ml-1 capitalize">
                              {booking.contactDetailsShared ? 'Contact Shared' : booking.status.replace('_', ' ')}
                            </span>
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{booking.description}</p>

                        {/* Task Description */}
                        {booking.taskDescription && (
                          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-xs font-medium text-gray-700 mb-1">Additional Details:</p>
                            <p className="text-xs sm:text-sm text-gray-600">{booking.taskDescription}</p>
                          </div>
                        )}

                        {/* Photos Section */}
                        {booking.photos && (booking.photos.beforeTask || booking.photos.afterTask) && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {booking.photos.beforeTask && (
                              <div className="border border-gray-200 rounded-lg p-2 sm:p-3 bg-gray-50">
                                <p className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Before Task
                                </p>
                                <img
                                  src={booking.photos.beforeTask.url}
                                  alt="Before task"
                                  className="w-full h-32 sm:h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(booking.photos!.beforeTask!.url, '_blank')}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(booking.photos.beforeTask.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {booking.photos.afterTask && (
                              <div className="border border-gray-200 rounded-lg p-2 sm:p-3 bg-gray-50">
                                <p className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  After Task
                                </p>
                                <img
                                  src={booking.photos.afterTask.url}
                                  alt="After task"
                                  className="w-full h-32 sm:h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(booking.photos!.afterTask!.url, '_blank')}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(booking.photos.afterTask.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 space-x-2 sm:space-x-4 mt-3 gap-y-1">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span className="truncate">{worker?.name || 'Unknown Worker'}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(booking.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {booking.estimatedDuration}h
                          </div>
                          <div className="font-medium text-gray-900">
                            ₹{booking.totalAmount}
                          </div>
                          {booking.paymentMethod && (
                            <div className="flex items-center text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {booking.paymentMethod}
                            </div>
                          )}
                        </div>

                        {/* Contact Details Section */}
                        {booking.contactDetailsShared && worker && (
                          <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h5 className="font-medium text-blue-900 mb-2 flex items-center text-sm">
                              <User className="h-4 w-4 mr-2" />
                              Worker Contact Information
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                              <div>
                                <span className="text-blue-700 font-medium">Worker Name:</span>
                                <span className="ml-2 text-blue-900">{worker.name}</span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Profession:</span>
                                <span className="ml-2 text-blue-900">{worker.profession}</span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Rate:</span>
                                <span className="ml-2 text-blue-900">₹{worker.hourlyRate}/h</span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Experience:</span>
                                <span className="ml-2 text-blue-900">{worker.experience}y</span>
                              </div>
                            </div>

                            {/* Company Proxy Number Section */}
                            <div className="mt-4 p-2 sm:p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0">
                                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h6 className="text-xs sm:text-sm font-semibold text-green-900 flex flex-wrap items-center gap-1">
                                    Contact Your Worker
                                    <div className="group relative">
                                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 cursor-help" />
                                      <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 sm:w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                        This is a company-managed number. Calls are forwarded to your assigned worker while protecting their privacy.
                                      </div>
                                    </div>
                                  </h6>
                                  <div className="mt-2">
                                    <a
                                      href={`tel:${booking.companyProxyNumber || COMPANY_PROXY_NUMBER}`}
                                      className="inline-flex items-center text-sm sm:text-lg font-bold text-green-700 hover:text-green-800 break-all"
                                    >
                                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                      {booking.companyProxyNumber || COMPANY_PROXY_NUMBER}
                                    </a>
                                  </div>
                                  <p className="mt-1 sm:mt-2 text-xs text-green-700 leading-relaxed">
                                    <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-1" />
                                    <strong>Privacy Protected:</strong> Your worker's personal number stays private.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 sm:mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded flex items-start gap-1">
                              <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0 mt-0.5" />
                              <span>
                                Your booking is confirmed! Use the company number above to coordinate with your worker.
                              </span>
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
                              className="inline-flex items-center px-3 py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-9"
                            >
                              {t('btn.cancel_booking')}
                            </button>
                          </div>
                        )}

                        {/* Review section for completed bookings */}
                        {booking.status === 'completed' && worker && (
                          <div className="mt-4 sm:mt-6 border-t pt-3 sm:pt-4">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">{t('review.leave_rating')}</h4>
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
                                {[1, 2, 3, 4, 5].map(n => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setReviewFormField(booking.id, { rating: n })}
                                    className={`p-1 rounded ${current.rating >= n ? 'text-yellow-500' : 'text-gray-300'}`}
                                    aria-label={`Rate ${n}`}
                                  >
                                    <Star className="h-4 w-4 sm:h-5 sm:w-5" fill={current.rating >= n ? '#F59E0B' : 'none'} />
                                  </button>
                                ))}
                              </div>
                              <textarea
                                rows={2}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs sm:text-sm"
                                value={current.comment}
                                onChange={(e) => setReviewFormField(booking.id, { comment: e.target.value })}
                                placeholder={t('review.comment_placeholder')}
                              />
                              <div className="mt-2 sm:mt-3">
                                <button
                                  onClick={() => handleSubmitReview(booking.id)}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 hover:from-primary-600 hover:via-accent-500 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 shadow-sm hover:shadow-md transition-all duration-200 min-h-9"
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

            {bookings.filter(booking => {
              if (bookingsSubTab === 'active') {
                return ['pending_admin', 'admin_verified', 'worker_assigned', 'accepted', 'in_progress'].includes(booking.status);
              } else {
                return ['completed', 'cancelled'].includes(booking.status);
              }
            }).length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-12 text-center">
                  <Calendar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <h3 className="mt-2 text-xs sm:text-sm font-medium text-gray-900">
                    {bookingsSubTab === 'active' ? 'No Active Bookings' : 'No Completed Bookings'}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    {bookingsSubTab === 'active'
                      ? 'You don\'t have any active bookings at the moment'
                      : 'You don\'t have any completed or cancelled bookings yet'}
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Booking Modal - Multi-Step */}
      {showBookingForm && selectedWorker && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white my-8">
            <div className="mt-3">
              {/* Step Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${bookingStep === 1 ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md' : 'bg-green-500 text-white'
                    }`}>
                    {bookingStep === 1 ? '1' : <CheckCircle className="h-5 w-5" />}
                  </div>
                  <div className={`h-1 w-16 ${bookingStep === 2 ? 'bg-gradient-to-r from-primary-600 to-primary-700' : 'bg-gray-300'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${bookingStep === 2 ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md' : 'bg-gray-300 text-gray-500'
                    }`}>
                    2
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600">
                  {bookingStep === 1 ? 'Step 1: Booking Details' : 'Step 2: Payment Method'}
                </p>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {bookingStep === 1 ? `Book ${selectedWorker.name}` : 'Select Payment Method'}
              </h3>

              {/* Step 1: Booking Form */}
              {bookingStep === 1 && (
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
                      Description <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={bookingForm.description}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the work needed (optional)..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Task Details <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      maxLength={500}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={bookingForm.taskDescription}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, taskDescription: e.target.value }))}
                      placeholder="Any specific requirements or details... (max 500 characters)"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {bookingForm.taskDescription.length}/500 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Before Task Photo <span className="text-gray-500 text-xs">(Optional, Recommended)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handlePhotoChange}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Upload a photo showing the current state. Max 5MB, JPEG/PNG only.
                    </p>
                    {bookingForm.beforeTaskPhoto && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {bookingForm.beforeTaskPhoto.name} ({(bookingForm.beforeTaskPhoto.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
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
                      onClick={() => {
                        setShowBookingForm(false);
                        setBookingStep(1);
                        setSelectedPaymentMethod('');
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 text-white py-2 px-4 rounded-md hover:from-primary-600 hover:via-accent-500 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Payment Method Selection */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Choose how you'd like to pay for this service
                    </p>
                    <div className="mt-3 text-lg font-semibold text-primary-600">
                      Total: ₹{selectedWorker.hourlyRate * bookingForm.estimatedDuration}
                    </div>
                  </div>

                  {/* Payment Processing Overlay */}
                  {isProcessingPayment && (
                    <div className="absolute inset-0 bg-white bg-opacity-95 rounded-md flex flex-col items-center justify-center z-10">
                      <Loader2 className="h-12 w-12 text-primary-600 animate-spin mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">Processing Payment...</p>
                      <p className="text-sm text-gray-600">Please wait while we confirm your payment</p>
                    </div>
                  )}

                  {/* Payment Options */}
                  <div className="space-y-3">
                    {/* PhonePe Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('PhonePe')}
                      disabled={isProcessingPayment}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-4 ${isProcessingPayment
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : selectedPaymentMethod === 'PhonePe'
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${selectedPaymentMethod === 'PhonePe' ? 'bg-purple-500' : 'bg-purple-100'
                        }`}>
                        <CreditCard className={`h-6 w-6 ${selectedPaymentMethod === 'PhonePe' ? 'text-white' : 'text-purple-600'
                          }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">PhonePe</div>
                        <div className="text-xs text-gray-500">UPI Payment</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'PhonePe'
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                        }`}>
                        {selectedPaymentMethod === 'PhonePe' && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </button>

                    {/* Net Banking Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('Net Banking')}
                      disabled={isProcessingPayment}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-4 ${isProcessingPayment
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : selectedPaymentMethod === 'Net Banking'
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${selectedPaymentMethod === 'Net Banking' ? 'bg-blue-500' : 'bg-blue-100'
                        }`}>
                        <Building2 className={`h-6 w-6 ${selectedPaymentMethod === 'Net Banking' ? 'text-white' : 'text-blue-600'
                          }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">Net Banking</div>
                        <div className="text-xs text-gray-500">All major banks</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'Net Banking'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                        }`}>
                        {selectedPaymentMethod === 'Net Banking' && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </button>

                    {/* Cash on Delivery Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('Cash on Delivery')}
                      disabled={isProcessingPayment}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-4 ${isProcessingPayment
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : selectedPaymentMethod === 'Cash on Delivery'
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${selectedPaymentMethod === 'Cash on Delivery' ? 'bg-green-500' : 'bg-green-100'
                        }`}>
                        <Banknote className={`h-6 w-6 ${selectedPaymentMethod === 'Cash on Delivery' ? 'text-white' : 'text-green-600'
                          }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">Cash on Delivery</div>
                        <div className="text-xs text-gray-500">Pay after service</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'Cash on Delivery'
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                        }`}>
                        {selectedPaymentMethod === 'Cash on Delivery' && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Navigation Buttons for Step 2 */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      disabled={isProcessingPayment}
                      className={`flex-1 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors ${isProcessingPayment
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                        }`}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePaymentConfirm}
                      disabled={!selectedPaymentMethod || isProcessingPayment}
                      className={`flex-1 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 font-medium transition-all flex items-center justify-center ${selectedPaymentMethod && !isProcessingPayment
                          ? 'bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 text-white hover:from-primary-600 hover:via-accent-500 hover:to-accent-600 focus:ring-accent-500 shadow-sm hover:shadow-md'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 max-w-md border border-white/20">
            <div className="p-2 bg-white/20 rounded-lg">
              <CheckCircle className="h-6 w-6 flex-shrink-0" />
            </div>
            <div>
              <div className="font-bold text-lg">Payment successful!</div>
              <div className="text-sm text-white/90">Your booking has been confirmed.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
