import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { Worker, Booking, District, Category, Profession } from '../types';
import { districts, categories, professions, skillsByCategory } from '../data/mockData';
import { 
  Search, Filter, MapPin, Star, Clock, LogOut, User, Calendar, 
  CheckCircle, XCircle, AlertCircle, RefreshCw, Navigation, Map,
  Bell, Settings, Heart, Shield, Award, TrendingUp
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import HelpButton from '../components/HelpButton';

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
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [workers, filters]);

  const loadData = () => {
    const allWorkers = storage.getWorkers();
    const userBookings = storage.getBookings().filter(booking => booking.customerId === user?.id);
    setWorkers(allWorkers);
    setBookings(userBookings);
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
          resolve({ latitude, longitude, address });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const enableLocationSharing = async () => {
    try {
      const location = await getCurrentLocation();
      if (user) {
        const updatedUser = {
          ...user,
          currentLocation: { ...location, lastUpdated: new Date() },
          locationSharingEnabled: true
        };
        storage.updateUser(user.id, updatedUser);
        setLocationSharingEnabled(true);
        loadData();
        alert('📍 Live location sharing enabled!');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('❌ Could not access your location. Please allow location permissions.');
    }
  };

  const disableLocationSharing = () => {
    if (user) {
      storage.updateUser(user.id, { locationSharingEnabled: false });
      setLocationSharingEnabled(false);
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
    if (filters.maxRate) {
      filtered = filtered.filter(worker => worker.hourlyRate <= Number(filters.maxRate));
    }

    setFilteredWorkers(filtered);
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
      workerId: selectedWorker.id,
      task: bookingForm.task,
      description: bookingForm.description,
      scheduledDate: new Date(bookingForm.scheduledDate),
      estimatedDuration: bookingForm.estimatedDuration,
      status: 'worker_assigned',
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
      contactDetailsShared: true,
    };

    storage.addBooking(newBooking);
    loadData();
    setShowBookingForm(false);
    setSelectedWorker(null);
    setBookingForm({ task: '', description: '', scheduledDate: '', estimatedDuration: 1 });
  };

  const getStatusIcon = (status: string, contactDetailsShared?: boolean) => {
    if (contactDetailsShared) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    switch (status) {
      case 'pending_admin': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'admin_verified': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'worker_assigned': return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string, contactDetailsShared?: boolean) => {
    if (contactDetailsShared) return 'bg-green-100 text-green-800';
    switch (status) {
      case 'pending_admin': return 'bg-orange-100 text-orange-800';
      case 'admin_verified': return 'bg-blue-100 text-blue-800';
      case 'worker_assigned': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkerSkills = (worker: Worker) => {
    const selectedProfession = professions.find(p => p.name === worker.profession);
    if (selectedProfession) {
      const availableSkills = skillsByCategory[selectedProfession.category] || [];
      return worker.skills.filter(skill => availableSkills.includes(skill));
    }
    return worker.skills;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LabourLink
                </h1>
                <p className="text-sm text-gray-500">Customer Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              
              <button
                onClick={locationSharingEnabled ? disableLocationSharing : enableLocationSharing}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  locationSharingEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Map className="h-4 w-4 mr-2" />
                {locationSharingEnabled ? 'Location On' : 'Location Off'}
              </button>
              
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-gray-500" />
                <Settings className="h-5 w-5 text-gray-500" />
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Welcome, {user?.name}
                </p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Workers</p>
                <p className="text-3xl font-bold text-blue-600">{filteredWorkers.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-green-600">{bookings.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
                <p className="text-3xl font-bold text-purple-600">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-3xl font-bold text-orange-600">
                  {bookings.filter(b => ['accepted', 'in_progress'].includes(b.status)).length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'browse'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              Browse Workers ({filteredWorkers.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'bookings'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              My Bookings ({bookings.length})
            </button>
          </nav>
        </div>

        {activeTab === 'browse' && (
          <>
            {/* Filters */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Filter className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Find Your Perfect Worker</h3>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
                    <select
                      value={filters.profession}
                      onChange={(e) => setFilters(prev => ({ ...prev, profession: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                    <select
                      value={filters.district}
                      onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Rate (₹/hr)</label>
                    <input
                      type="number"
                      value={filters.maxRate}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
                      placeholder="No limit"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Workers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map(worker => (
                <div key={worker.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-14 w-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                          <User className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{worker.name}</h3>
                          <p className="text-sm text-gray-600">{worker.profession}</p>
                          {worker.isVerified && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Shield className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600 font-medium">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                        {districts.find(d => d.id === worker.district)?.name}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-2 text-yellow-500" />
                        {worker.rating} ({worker.totalJobs} jobs)
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        ₹{worker.hourlyRate}/hour
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{worker.bio}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {getWorkerSkills(worker).slice(0, 3).map(skill => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {getWorkerSkills(worker).length > 3 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{getWorkerSkills(worker).length - 3} more
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleBookWorker(worker)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredWorkers.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/20">
                  <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Workers Found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters to find more workers
                  </p>
                  <button
                    onClick={() => setFilters({ profession: '', district: '', category: '', maxRate: '' })}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {bookings.map(booking => {
              const worker = workers.find(w => w.id === booking.workerId);
              return (
                <div key={booking.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{booking.task}</h3>
                        <span className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status, booking.contactDetailsShared)}`}>
                          {getStatusIcon(booking.status, booking.contactDetailsShared)}
                          <span className="ml-2 capitalize">
                            {booking.contactDetailsShared ? 'Contact Shared' : booking.status.replace('_', ' ')}
                          </span>
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4">{booking.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-blue-500" />
                          {worker?.name || 'Unknown Worker'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-green-500" />
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-orange-500" />
                          {booking.estimatedDuration} hours
                        </div>
                        <div className="flex items-center font-semibold text-gray-900">
                          ₹{booking.totalAmount}
                        </div>
                      </div>

                      {booking.contactDetailsShared && worker && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Worker Contact Details
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
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {bookings.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/20">
                  <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start browsing workers to make your first booking
                  </p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Browse Workers
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingForm && selectedWorker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold">Book {selectedWorker.name}</h3>
              <p className="text-blue-100">{selectedWorker.profession}</p>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={bookingForm.task}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, task: e.target.value }))}
                  placeholder="e.g., House Cleaning"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  value={bookingForm.description}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the work needed..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={bookingForm.scheduledDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours) *</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={bookingForm.estimatedDuration}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, estimatedDuration: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Rate: ₹{selectedWorker.hourlyRate}/hour</span>
                  <span>Duration: {bookingForm.estimatedDuration} hours</span>
                  <span className="font-bold text-lg">Total: ₹{selectedWorker.hourlyRate * bookingForm.estimatedDuration}</span>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Button */}
      <HelpButton />
    </div>
  );
};

export default CustomerDashboard;