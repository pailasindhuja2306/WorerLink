import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { Worker, Customer, Booking, User } from '../types';
import { districts, categories } from '../data/mockData';
import { Users, Calendar, DollarSign, CheckCircle, XCircle, AlertCircle, LogOut, Shield, TrendingUp, Eye, UserCheck, UserX } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'bookings' | 'verification'>('overview');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [verificationForm, setVerificationForm] = useState({
    customerVerified: false,
    workerVerified: false,
    callNotes: '',
    adminNotes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allWorkers = storage.getWorkers();
    const allCustomers = storage.getCustomers();
    const allBookings = storage.getBookings();

    setWorkers(allWorkers);
    setCustomers(allCustomers);
    setBookings(allBookings);
  };

  const handleWorkerVerification = (workerId: string, verified: boolean) => {
    storage.updateWorker(workerId, { isVerified: verified });
    loadData();
  };

  const handleBookingVerification = (bookingId: string) => {
    if (!user) return;

    const verification = {
      customerVerified: verificationForm.customerVerified,
      workerVerified: verificationForm.workerVerified,
      adminId: user.id,
      verifiedAt: new Date(),
      callNotes: verificationForm.callNotes,
    };

    // Get the booking before updating it
    const currentBooking = storage.getBookings().find(b => b.id === bookingId);

    // Update booking status to admin_verified and add contact sharing flag
    storage.updateBooking(bookingId, {
      status: 'admin_verified',
      adminVerification: verification,
      adminNotes: verificationForm.adminNotes,
      contactDetailsShared: true, // Flag to indicate contact details are now shared
      liveLocationSharing: {
        enabled: true, // Enable live location sharing after verification
        customerLocation: currentBooking?.liveLocationSharing?.customerLocation,
        workerLocation: currentBooking?.liveLocationSharing?.workerLocation
      }
    });

    // Create notifications for both customer and worker
    const booking = storage.getBookings().find(b => b.id === bookingId);
    if (booking) {
      const customerNotification = {
        id: Date.now().toString() + '_customer',
        userId: booking.customerId,
        title: 'Worker Contact Details Available',
        message: `After admin verification, you now have access to your assigned worker's contact details. You can contact them directly to coordinate the job.`,
        type: 'booking' as const,
        isRead: false,
        createdAt: new Date(),
        bookingId: bookingId,
      };

      const workerNotification = {
        id: Date.now().toString() + '_worker',
        userId: booking.workerId!,
        title: 'Customer Contact Details Available',
        message: `After admin verification, you now have access to the customer's contact details. You can contact them directly to coordinate the job.`,
        type: 'booking' as const,
        isRead: false,
        createdAt: new Date(),
        bookingId: bookingId,
      };

      storage.addNotification(customerNotification);
      storage.addNotification(workerNotification);
    }

    loadData();
    setSelectedBooking(null);
    setVerificationForm({
      customerVerified: false,
      workerVerified: false,
      callNotes: '',
      adminNotes: '',
    });
  };


  const handleRejectBooking = (bookingId: string) => {
    if (!user) return;

    // Fetch current booking to preserve/clear live location data
    const current = storage.getBookings().find(b => b.id === bookingId);

    const adminVerification = {
      customerVerified: false,
      workerVerified: false,
      adminId: user.id,
      verifiedAt: new Date(),
      callNotes: verificationForm.callNotes,
    };

    storage.updateBooking(bookingId, {
      status: 'rejected',
      adminNotes: verificationForm.adminNotes,
      adminVerification,
      contactDetailsShared: false,
      liveLocationSharing: {
        enabled: false,
        customerLocation: current?.liveLocationSharing?.customerLocation,
        workerLocation: current?.liveLocationSharing?.workerLocation,
      }
    });

    // Add notifications for both parties
    const booking = storage.getBookings().find(b => b.id === bookingId);
    if (booking) {
      const customerNotification = {
        id: Date.now().toString() + '_customer_reject',
        userId: booking.customerId,
        title: 'Booking Rejected',
        message: `Your booking "${booking.task}" was rejected by an admin. Reason: ${verificationForm.adminNotes || 'No reason provided'}`,
        type: 'booking' as const,
        isRead: false,
        createdAt: new Date(),
        bookingId: bookingId,
      };

      const workerNotification = {
        id: Date.now().toString() + '_worker_reject',
        userId: booking.workerId || '',
        title: 'Booking Rejected',
        message: `The booking "${booking.task}" you were assigned to has been rejected by an admin.`,
        type: 'booking' as const,
        isRead: false,
        createdAt: new Date(),
        bookingId: bookingId,
      };

      storage.addNotification(customerNotification);
      if (booking.workerId) storage.addNotification(workerNotification);
    }

    loadData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_admin':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
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

  const getStatusColor = (status: string) => {
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

  const getVerificationColor = (isVerified: boolean) => {
    return isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  // Calculate statistics
  const totalWorkers = workers.length;
  const verifiedWorkers = workers.filter((w: Worker) => w.isVerified).length;
  const totalCustomers = customers.length;
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b: Booking) => b.status === 'completed').length;
  const pendingBookings = bookings.filter((b: Booking) => b.status === 'pending_admin').length;
  const totalRevenue = bookings
    .filter((b: Booking) => b.status === 'completed')
    .reduce((sum: number, b: Booking) => sum + b.totalAmount, 0);
  const platformCommission = totalRevenue * 0.1; // 10% commission

  // If an admin selected a booking, always refresh the latest booking data from storage here
  const currentBooking = selectedBooking
    ? storage.getBookings().find(b => b.id === selectedBooking.id) || selectedBooking
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">{t('app.title')}</h1>
              <span className="ml-4 text-sm text-gray-500">{t('header.admin')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
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
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'workers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Workers ({totalWorkers})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Bookings ({totalBookings})
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'verification'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Verification ({bookings.filter((b: Booking) => b.status === 'pending_admin').length})
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Workers</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalWorkers}</p>
                    <p className="text-xs text-gray-500">{verifiedWorkers} verified</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Customers</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-semibold text-gray-900">{totalBookings}</p>
                    <p className="text-xs text-gray-500">{pendingBookings} pending</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Platform Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">₹{platformCommission.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">10% commission</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h3>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{booking.task}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Worker Verification</h3>
                <div className="space-y-3">
                  {workers.filter(w => !w.isVerified).slice(0, 5).map(worker => (
                    <div key={worker.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{worker.name}</p>
                        <p className="text-xs text-gray-500">{worker.profession}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleWorkerVerification(worker.id, true)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Verify
                        </button>
                        <button
                          onClick={() => handleWorkerVerification(worker.id, false)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                        >
                          <UserX className="h-3 w-3 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workers' && (
          <div className="space-y-4">
            {workers.map(worker => (
              <div key={worker.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{worker.name}</h3>
                        <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVerificationColor(worker.isVerified)}`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {worker.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{worker.profession}</p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4 mt-2">
                        <span>₹{worker.hourlyRate}/hour</span>
                        <span>{worker.experience} years exp</span>
                        <span>{worker.totalJobs} jobs</span>
                        <span>Rating: {worker.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!worker.isVerified && (
                      <>
                        <button
                          onClick={() => handleWorkerVerification(worker.id, true)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Verify
                        </button>
                        <button
                          onClick={() => handleWorkerVerification(worker.id, false)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedWorker(worker)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.map(booking => {
              const worker = workers.find(w => w.id === booking.workerId);
              const customer = customers.find(c => c.id === booking.customerId);
              return (
                <div key={booking.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{booking.task}</h3>
                        <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1 capitalize">{booking.status.replace('_', ' ')}</span>
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{booking.description}</p>

                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {worker?.name || 'Unknown Worker'}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {customer?.name || 'Unknown Customer'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ₹{booking.totalAmount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Admin Verification</h3>
              <div className="space-y-4">
                {bookings.filter(b => b.status === 'pending_admin').map(booking => {
                  const customer = customers.find(c => c.id === booking.customerId);
                  return (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{booking.task}</h4>
                          <p className="text-sm text-gray-600 mt-1">{booking.description}</p>

                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Customer:</span>
                              <span className="ml-2 font-medium">{customer?.name}</span>
                              <span className="ml-2 text-gray-500">({customer?.phone})</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Gender:</span>
                              <span className="ml-2">{customer?.gender}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Location:</span>
                              <span className="ml-2">{booking.location.address}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <span className="ml-2 font-medium">₹{booking.totalAmount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Verify
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {bookings.filter(b => b.status === 'pending_admin').length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending verifications</h3>
                    <p className="mt-1 text-sm text-gray-500">All bookings have been verified.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


      {selectedWorker && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Worker Details
                </h3>
                <button
                  onClick={() => setSelectedWorker(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedWorker.name}</h4>
                  <p className="text-sm text-gray-500">{selectedWorker.profession}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Experience:</span>
                    <span className="ml-2">{selectedWorker.experience} years</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rate:</span>
                    <span className="ml-2">₹{selectedWorker.hourlyRate}/hour</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rating:</span>
                    <span className="ml-2">{selectedWorker.rating}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Jobs:</span>
                    <span className="ml-2">{selectedWorker.totalJobs}</span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 text-sm">Bio:</span>
                  <p className="text-sm text-gray-900 mt-1">{selectedWorker.bio}</p>
                </div>

                <div>
                  <span className="text-gray-500 text-sm">Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedWorker.skills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {currentBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Verify Booking & View Contact Details
                </h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Booking Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{currentBooking.task}</h4>
                  <p className="text-sm text-gray-600 mb-3">{currentBooking.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <span className="ml-2 font-medium">₹{currentBooking.totalAmount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2">{new Date(currentBooking.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Contact Details */}
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    Customer Contact Details (Call for Verification)
                  </h5>
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-800">
                      <strong>📞 Call customer</strong> using the phone number below to verify booking details and confirm their availability.
                    </p>
                  </div>
                  {(() => {
                    const customer = customers.find(c => c.id === currentBooking.customerId);
                    return customer ? (
                      <div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Name:</span>
                            <span className="ml-2 font-medium">{customer.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">📞 Phone (Call now):</span>
                            <span className="ml-2 font-medium text-blue-600 text-lg">{customer.phone}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Email:</span>
                            <span className="ml-2 font-medium">{customer.email}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Gender:</span>
                            <span className="ml-2">{customer.gender}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Address:</span>
                            <span className="ml-2">{currentBooking.location.address}</span>
                          </div>
                        </div>

                        {/* Customer Location Sharing Status */}
                        <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-purple-800 font-medium">📍 Live Location Sharing:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer?.locationSharingEnabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              {customer?.locationSharingEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          {customer?.currentLocation && (
                            <div className="mt-1 text-xs text-purple-600">
                              Last location: {customer.currentLocation.address}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Customer details not found</p>
                    );
                  })()}
                </div>

                {/* Worker Selection & Contact Details */}
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-green-600" />
                    Select Worker & Get Contact Details for Verification
                  </h5>
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>📞 Admin Action Required:</strong> Select a worker below to get their contact details.
                      You need to call them to verify their availability and confirm the booking.
                    </p>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {workers.filter(worker =>
                      worker.availability === 'available' &&
                      worker.isVerified
                    ).map(worker => (
                      <div key={worker.id} className={`border rounded-lg p-3 hover:bg-gray-50 cursor-pointer ${currentBooking.workerId === worker.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                        onClick={() => {
                          storage.updateBooking(currentBooking.id, { workerId: worker.id });
                          // Update the selectedBooking state with the new workerId
                          setSelectedBooking(prev => prev ? { ...prev, workerId: worker.id } : null);
                          loadData();
                        }}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h6 className="font-medium text-gray-900">{worker.name}</h6>
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">{worker.profession}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div>
                                <span className="text-gray-500">📞 Phone (Call for verification):</span>
                                <span className="ml-1 font-medium text-blue-600">{worker.phone}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">✉️ Email:</span>
                                <span className="ml-1">{worker.email}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">💰 Rate:</span>
                                <span className="ml-1">₹{worker.hourlyRate}/hr</span>
                              </div>
                              <div>
                                <span className="text-gray-500">⭐ Rating:</span>
                                <span className="ml-1">{worker.rating}</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            {currentBooking.workerId === worker.id ? (
                              <div className="text-green-600 text-sm font-medium">✓ Selected</div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  storage.updateBooking(currentBooking.id, { workerId: worker.id });
                                  // Update the selectedBooking state with the new workerId
                                  setSelectedBooking(prev => prev ? { ...prev, workerId: worker.id } : null);
                                  loadData();
                                }}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                              >
                                Select
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {currentBooking.workerId && (() => {
                    const selectedWorker = workers.find(w => w.id === currentBooking.workerId);
                    return (
                      <div className="mt-3 space-y-3">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>📞 After Verification:</strong> Once you verify both parties via phone calls,
                            the customer will receive the worker's contact details, and the worker will receive the customer's contact details.
                          </p>
                        </div>
                        {selectedWorker && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h6 className="font-medium text-blue-900 mb-2">Selected Worker Contact Details:</h6>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-blue-700 font-medium">📞 Phone:</span>
                                <span className="ml-2 font-mono text-blue-900">{selectedWorker.phone}</span>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">✉️ Email:</span>
                                <span className="ml-2 text-blue-900">{selectedWorker.email}</span>
                              </div>
                            </div>

                            {/* Location Sharing Status */}
                            <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-200">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-purple-800 font-medium">📍 Live Location Sharing:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedWorker.locationSharingEnabled
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                                  }`}>
                                  {selectedWorker.locationSharingEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                              {selectedWorker.currentLocation && (
                                <div className="mt-1 text-xs text-purple-600">
                                  Last location: {selectedWorker.currentLocation.address}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Verification Form */}
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">📞 Verification Checklist - Call Both Parties</h5>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="customerVerified"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                        checked={verificationForm.customerVerified}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, customerVerified: e.target.checked }))}
                      />
                      <div className="ml-2">
                        <label htmlFor="customerVerified" className="block text-sm text-gray-700 font-medium">
                          ✅ Customer Verified
                        </label>
                        <p className="text-xs text-gray-500">
                          Called customer using their phone number above. Confirmed booking details and their availability.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="workerVerified"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                        checked={verificationForm.workerVerified}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, workerVerified: e.target.checked }))}
                      />
                      <div className="ml-2">
                        <label htmlFor="workerVerified" className="block text-sm text-gray-700 font-medium">
                          ✅ Worker Verified
                        </label>
                        <p className="text-xs text-gray-500">
                          Called worker using their phone number above. Confirmed their availability and willingness to take the job.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Call Notes
                    </label>
                    <textarea
                      rows={3}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={verificationForm.callNotes}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, callNotes: e.target.value }))}
                      placeholder="Notes from verification calls..."
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      rows={2}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={verificationForm.adminNotes}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                      placeholder="Additional admin notes..."
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const confirmReject = window.confirm('Are you sure you want to reject this booking? This will notify both parties.');
                      if (!confirmReject) return;
                      handleRejectBooking(currentBooking.id);
                      setSelectedBooking(null);
                    }}
                    className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    ⛔ Reject Booking
                  </button>
                  <button
                    onClick={() => {
                      if (!currentBooking.workerId) {
                        alert('Please select a worker first');
                        return;
                      }
                      handleBookingVerification(currentBooking.id);
                    }}
                    disabled={!verificationForm.customerVerified || !verificationForm.workerVerified}
                    className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    ✅ Complete Verification & Share Contact Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
