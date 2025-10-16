import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { Worker, Booking, Customer } from '../types';
import { districts, skillsByCategory, professions } from '../data/mockData';
import { User, Calendar, Clock, CheckCircle, XCircle, AlertCircle, LogOut, Settings, Star, MapPin, DollarSign, Navigation, Map } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

const WorkerDashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile'>('bookings');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const LogOut = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  };
  const [profileForm, setProfileForm] = useState({
    bio: '',
    hourlyRate: 0,
    availability: 'available' as 'available' | 'busy' | 'offline',
    skills: [] as string[],
  });
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    if (user?.type === 'worker') {
      const workerData = storage.getWorkers().find(w => w.id === user.id);
      const workerBookings = storage.getBookings().filter(booking => booking.workerId === user.id);
      const allCustomers = storage.getCustomers();

      setWorker(workerData || null);
      setBookings(workerBookings);
      setCustomers(allCustomers);
      setLocationSharingEnabled(workerData?.locationSharingEnabled || false);

      if (workerData) {
        setProfileForm({
          bio: workerData.bio,
          hourlyRate: workerData.hourlyRate,
          availability: workerData.availability,
          skills: workerData.skills,
        });

        // Load available skills for the worker's profession
        const selectedProfession = professions.find(p => p.name === workerData.profession);
        if (selectedProfession) {
          const skills = skillsByCategory[selectedProfession.category] || [];
          setAvailableSkills(skills);
        }
      }
    }
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

      if (worker) {
        // Update worker's location
        const updatedWorker = {
          ...worker,
          currentLocation: {
            ...location,
            lastUpdated: new Date()
          },
          locationSharingEnabled: true
        };

        storage.updateWorker(worker.id, updatedWorker);
        updateUser(updatedWorker);
        setLocationSharingEnabled(true);

        // Update all bookings with live location sharing
        const workerBookings = storage.getBookings().filter(booking => booking.workerId === worker.id);
        workerBookings.forEach(booking => {
          if (booking.contactDetailsShared) {
            storage.updateBooking(booking.id, {
              liveLocationSharing: {
                enabled: true,
                customerLocation: booking.liveLocationSharing?.customerLocation,
                workerLocation: {
                  ...location,
                  lastUpdated: new Date()
                }
              }
            });
          }
        });

        loadData();
        alert('📍 Live location sharing enabled! Your location will be shared with customers.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('❌ Could not access your location. Please allow location permissions and try again.');
    }
  };

  const disableLocationSharing = () => {
    if (worker) {
      storage.updateWorker(worker.id, { locationSharingEnabled: false });
      setLocationSharingEnabled(false);

      // Disable live location sharing for all bookings
      const workerBookings = storage.getBookings().filter(booking => booking.workerId === worker.id);
      workerBookings.forEach(booking => {
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

  const handleBookingAction = (bookingId: string, action: 'accept' | 'reject' | 'complete') => {
    const status = action === 'accept' ? 'accepted' :
      action === 'reject' ? 'rejected' : 'completed';

    storage.updateBooking(bookingId, { status });
    loadData();
  };

  const canCancel = (status: string, contactDetailsShared?: boolean) => {
    const cancellableStatuses = ['admin_verified', 'worker_assigned', 'accepted', 'in_progress'];
    return !!contactDetailsShared || cancellableStatuses.includes(status);
  };

  const handleCancelBooking = (bookingId: string) => {
    const booking = storage.getBookings().find(b => b.id === bookingId);
    if (!booking) return;

    const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmCancel) return;

    storage.updateBooking(bookingId, {
      status: 'cancelled',
      contactDetailsShared: false,
      liveLocationSharing: {
        ...booking.liveLocationSharing,
        enabled: false,
      }
    });

    const workerNotification = {
      id: Date.now().toString() + '_worker_cancel',
      userId: booking.workerId || '',
      title: 'Booking Cancelled',
      message: `You cancelled the booking "${booking.task}".`,
      type: 'booking' as const,
      isRead: false,
      createdAt: new Date(),
      bookingId: bookingId,
    };

    const customerNotification = {
      id: Date.now().toString() + '_customer_cancel',
      userId: booking.customerId,
      title: 'Booking Cancelled',
      message: `The booking "${booking.task}" was cancelled by the worker.`,
      type: 'booking' as const,
      isRead: false,
      createdAt: new Date(),
      bookingId: bookingId,
    };

    storage.addNotification(customerNotification);
    storage.addNotification(workerNotification);

    loadData();
    alert('Booking cancelled successfully.');
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (worker) {
      const updates = {
        bio: profileForm.bio,
        hourlyRate: profileForm.hourlyRate,
        availability: profileForm.availability,
        skills: profileForm.skills,
      };

      storage.updateWorker(worker.id, updates);
      // Update user context with worker-specific fields
      const userUpdates = {
        ...updates,
        type: 'worker' as const,
      };
      updateUser(userUpdates);
      setShowProfileEdit(false);
      loadData();
    }
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skill = e.target.value;
    if (e.target.checked) {
      setProfileForm(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    } else {
      setProfileForm(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s !== skill)
      }));
    }
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

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('profile.not_found')}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">{t('app.title')}</h1>
              <span className="ml-4 text-sm text-gray-500">{t('header.worker')}</span>
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
              <span className="text-sm text-gray-700">{t('header.welcome')}, {worker.username ? `@${worker.username}` : worker.name}</span>
              <Link to="/login" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                {t('btn.logout')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t('tab.bookings')} ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t('tab.profile')}
            </button>
          </nav>
        </div>

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.map(booking => {
              const customer = customers.find(c => c.id === booking.customerId);
              return (
                <div key={booking.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{booking.task}</h3>
                        <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status, booking.contactDetailsShared)}`}>
                          {getStatusIcon(booking.status, booking.contactDetailsShared)}
                            <span className="ml-1 capitalize">
                              {booking.contactDetailsShared ? t('booking.status.contact_shared') : booking.status.replace('_', ' ')}
                            </span>
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{booking.description}</p>

                      <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {customer?.name || t('unknown.customer')}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {booking.estimatedDuration} hours
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ₹{booking.totalAmount}
                        </div>
                      </div>

                      {/* Contact Details Section */}
                      {booking.contactDetailsShared && customer && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                          <h5 className="font-medium text-green-900 mb-2 flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {t('contact.customer_details_title')}
                            </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-green-700 font-medium">{t('contact.name')}</span>
                                <span className="ml-2 text-green-900">{customer.name}</span>
                            </div>
                            <div>
                                <span className="text-green-700 font-medium">{t('contact.phone')}</span>
                                <span className="ml-2 text-green-900 font-mono">{customer.phone}</span>
                            </div>
                            <div>
                                <span className="text-green-700 font-medium">{t('contact.email')}</span>
                                <span className="ml-2 text-green-900">{customer.email}</span>
                            </div>
                            <div>
                              <span className="text-green-700 font-medium">{t('label.gender')}</span>
                              <span className="ml-2 text-green-900">{customer.gender}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-green-700 font-medium">{t('label.current_location')}</span>
                              <span className="ml-2 text-green-900">{booking.location.address}</span>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-green-700 bg-green-100 p-2 rounded">
                            💡 After admin verification, you now have the customer's contact details. You can call them directly to coordinate the job.
                          </div>

                          {/* Live Location Sharing */}
                          {booking.liveLocationSharing?.enabled && (
                            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <h6 className="font-medium text-purple-900 mb-2 flex items-center">
                                <Navigation className="h-4 w-4 mr-2" />
                                {t('live_location.title')}
                              </h6>

                              {booking.liveLocationSharing.workerLocation && (
                                  <div className="text-sm text-purple-700 mb-2">
                                  <strong>{t('live_location.your_location')}</strong> {booking.liveLocationSharing.workerLocation.address}
                                  <span className="text-xs text-purple-600 ml-2">
                                    (Updated: {new Date(booking.liveLocationSharing.workerLocation.lastUpdated).toLocaleTimeString()})
                                  </span>
                                </div>
                              )}

                              {booking.liveLocationSharing.customerLocation && (
                                  <div className="text-sm text-purple-700">
                                  <strong>{t('live_location.customer_location')}</strong> {booking.liveLocationSharing.customerLocation.address}
                                  <span className="text-xs text-purple-600 ml-2">
                                    (Updated: {new Date(booking.liveLocationSharing.customerLocation.lastUpdated).toLocaleTimeString()})
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

                      {(booking.status === 'pending_admin' || booking.status === 'worker_assigned') && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleBookingAction(booking.id, 'accept')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('btn.accept')}
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking.id, 'reject')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t('btn.reject')}
                          </button>
                        </div>
                      )}

                      {booking.status === 'accepted' && (
                        <button
                          onClick={() => handleBookingAction(booking.id, 'complete')}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t('btn.mark_complete')}
                        </button>
                      )}
                      {canCancel(booking.status, booking.contactDetailsShared) && (
                          <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            {t('btn.cancel_booking')}
                        </button>
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

        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                <button
                  onClick={() => setShowProfileEdit(!showProfileEdit)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Edit Profile
                </button>
              </div>

              {!showProfileEdit ? (
                <div className="space-y-6">
                  <div className="flex items-center">
                    <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{worker.name}</h4>
                      <p className="text-sm text-gray-500">{worker.profession}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(worker.availability)}`}>
                        {worker.availability}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience</label>
                      <p className="mt-1 text-sm text-gray-900">{worker.experience} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                      <p className="mt-1 text-sm text-gray-900">₹{worker.hourlyRate}/hour</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rating</label>
                      <div className="mt-1 flex items-center">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="ml-1 text-sm text-gray-900">{worker.rating}</span>
                        <span className="ml-1 text-sm text-gray-500">({worker.totalJobs} jobs)</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <div className="mt-1 flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-1" />
                        {districts.find(d => d.id === worker.district)?.name}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <p className="mt-1 text-sm text-gray-900">{worker.bio}</p>
                  </div>

                  {/* Reviews */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reviews</label>
                    {(!worker.reviews || worker.reviews.length === 0) ? (
                      <p className="mt-1 text-sm text-gray-500">No reviews yet.</p>
                    ) : (
                      <div className="mt-2 space-y-3">
                        {worker.reviews.slice().reverse().map(r => (
                          <div key={r.id} className="border rounded p-3">
                            <div className="flex items-center text-sm text-gray-700">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span className="ml-1 font-medium">{r.rating}</span>
                              <span className="ml-2 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            {r.comment && (
                              <p className="mt-1 text-sm text-gray-700">{r.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Skills</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {availableSkills.filter(skill => worker.skills.includes(skill)).map(skill => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hourly Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={profileForm.hourlyRate}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Availability
                      </label>
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={profileForm.availability}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, availability: e.target.value as 'available' | 'busy' | 'offline' }))}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills
                      <span className="text-xs text-gray-500 ml-2">
                        (Select skills for {worker?.profession})
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSkills.map(skill => (
                        <label key={skill} className="flex items-center">
                          <input
                            type="checkbox"
                            value={skill}
                            checked={profileForm.skills.includes(skill)}
                            onChange={handleSkillsChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowProfileEdit(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
