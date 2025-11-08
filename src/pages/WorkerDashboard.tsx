import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { Worker, Booking, Customer, WorkerStatistics } from '../types';
import { districts, skillsByCategory, professions } from '../data/mockData';
import { User, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Settings, Star, MapPin, DollarSign, Navigation, Map, Phone, Shield, Info, TrendingUp, Award, Target, BarChart3, PieChart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { calculateWorkerStatistics, getPerformanceBadge, getSuccessRateColor, getRatingColor } from '../utils/workerStats';

// Company proxy number for privacy-protected communication
const COMPANY_PROXY_NUMBER = '+91-9876-543210';

const WorkerDashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'statistics'>('bookings');
  const [bookingsSubTab, setBookingsSubTab] = useState<'active' | 'completed'>('active');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(false);
  const [statistics, setStatistics] = useState<WorkerStatistics | null>(null);
  const [profileForm, setProfileForm] = useState({
    bio: '',
    hourlyRate: 0,
    availability: 'available' as 'available' | 'busy' | 'offline',
    skills: [] as string[],
  });
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  // Timeout checking and reminder system
  useEffect(() => {
    const checkTimeouts = () => {
      const now = new Date();
      const allBookings = storage.getBookings();
      let hasChanges = false;

      allBookings.forEach((booking) => {
        // Check for expired bookings (worker didn't respond within 15 minutes)
        if (
          booking.workerId === user?.id &&
          booking.status === 'worker_assigned' &&
          booking.responseDeadline &&
          new Date(booking.responseDeadline) < now &&
          !booking.workerResponseTime
        ) {
          // Expire the booking
          storage.updateBooking(booking.id, {
            status: 'expired',
            updatedAt: new Date(),
          });

          // Notify customer that worker didn't respond
          const customerNotification = {
            id: Date.now().toString() + '_timeout_' + Math.random(),
            userId: booking.customerId,
            title: 'Worker Did Not Respond',
            message: `The worker did not respond to your booking "${booking.task}" within 15 minutes. Please try booking another worker.`,
            type: 'booking_timeout' as const,
            isRead: false,
            createdAt: new Date(),
            bookingId: booking.id,
          };
          storage.addNotification(customerNotification);
          hasChanges = true;
        }

        // Check for pre-task reminders
        if (
          booking.workerId === user?.id &&
          booking.status === 'accepted' &&
          booking.scheduledDate &&
          booking.remindersSent
        ) {
          const scheduledTime = new Date(booking.scheduledDate).getTime();
          const currentTime = now.getTime();
          const oneHourBefore = scheduledTime - (60 * 60 * 1000);
          const thirtyMinBefore = scheduledTime - (30 * 60 * 1000);

          // Send 1-hour reminder
          if (!booking.remindersSent.oneHour && currentTime >= oneHourBefore && currentTime < scheduledTime && booking.workerId) {
            const customer = storage.getCustomers().find(c => c.id === booking.customerId);
            const reminderNotification = {
              id: Date.now().toString() + '_reminder1hr_' + Math.random(),
              userId: booking.workerId,
              title: '⏰ Task Reminder - 1 Hour',
              message: `Reminder: Your task "${booking.task}" is scheduled in 1 hour at ${new Date(booking.scheduledDate).toLocaleTimeString()}. Customer: ${customer?.name || 'Unknown'}. Location: ${booking.location.address}. Please prepare and be ready to start on time.`,
              type: 'task_reminder_1hr' as const,
              isRead: false,
              createdAt: new Date(),
              bookingId: booking.id,
            };
            storage.addNotification(reminderNotification);
            storage.updateBooking(booking.id, {
              remindersSent: { ...booking.remindersSent, oneHour: true },
            });
            hasChanges = true;
          }

          // Send 30-minute reminder
          if (!booking.remindersSent.thirtyMin && currentTime >= thirtyMinBefore && currentTime < scheduledTime && booking.workerId) {
            const customer = storage.getCustomers().find(c => c.id === booking.customerId);
            const reminderNotification = {
              id: Date.now().toString() + '_reminder30min_' + Math.random(),
              userId: booking.workerId,
              title: '⏰ Task Reminder - 30 Minutes',
              message: `Reminder: Your task "${booking.task}" is scheduled in 30 minutes at ${new Date(booking.scheduledDate).toLocaleTimeString()}. Customer: ${customer?.name || 'Unknown'}. Contact: ${customer?.phone || 'N/A'}. Location: ${booking.location.address}. Please prepare and be ready to start on time.`,
              type: 'task_reminder_30min' as const,
              isRead: false,
              createdAt: new Date(),
              bookingId: booking.id,
            };
            storage.addNotification(reminderNotification);
            storage.updateBooking(booking.id, {
              remindersSent: { ...booking.remindersSent, thirtyMin: true },
            });
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        loadData();
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkTimeouts, 10000);
    checkTimeouts(); // Run immediately

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Update countdown timers every second
  useEffect(() => {
    const updateTimers = () => {
      const now = new Date();
      const newTimeRemaining: Record<string, number> = {};

      bookings.forEach((booking) => {
        if (
          booking.status === 'worker_assigned' &&
          booking.responseDeadline &&
          !booking.workerResponseTime
        ) {
          const deadline = new Date(booking.responseDeadline);
          const remaining = Math.max(0, deadline.getTime() - now.getTime());
          newTimeRemaining[booking.id] = remaining;
        }
      });

      setTimeRemaining(newTimeRemaining);
    };

    const interval = setInterval(updateTimers, 1000);
    updateTimers(); // Run immediately

    return () => clearInterval(interval);
  }, [bookings]);

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

        // Calculate worker statistics
        const allBookings = storage.getBookings();
        const workerReviews = workerData.reviews || [];
        const stats = calculateWorkerStatistics(user.id, allBookings, workerReviews);
        setStatistics(stats);
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

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedBookingForCompletion, setSelectedBookingForCompletion] = useState<Booking | null>(null);
  const [afterTaskPhoto, setAfterTaskPhoto] = useState<File | null>(null);

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAfterPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setAfterTaskPhoto(file);
    }
  };

  const handleBookingAction = (bookingId: string, action: 'accept' | 'reject' | 'complete') => {
    if (action === 'complete') {
      // Show modal for photo upload
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setSelectedBookingForCompletion(booking);
        setShowCompleteModal(true);
      }
      return;
    }

    const status = action === 'accept' ? 'accepted' : 'rejected';
    storage.updateBooking(bookingId, {
      status,
      workerResponseTime: new Date(), // Record when worker responded
      updatedAt: new Date(),
    });
    loadData();
  };

  const handleCompleteBooking = async () => {
    if (!selectedBookingForCompletion || !user) return;

    let afterTaskPhotoData = undefined;

    // Convert photo to base64 if uploaded
    if (afterTaskPhoto) {
      try {
        const base64 = await fileToBase64(afterTaskPhoto);
        afterTaskPhotoData = {
          url: base64,
          uploadedAt: new Date(),
          uploadedBy: user.id,
          fileName: afterTaskPhoto.name,
          fileSize: afterTaskPhoto.size,
        };
      } catch (error) {
        console.error('Error converting photo:', error);
        alert('Failed to upload photo. Please try again.');
        return;
      }
    }

    // Update booking with completion and photo
    const updates: Partial<Booking> = {
      status: 'completed',
    };

    if (afterTaskPhotoData) {
      updates.photos = {
        ...selectedBookingForCompletion.photos,
        afterTask: afterTaskPhotoData,
      };
    }

    storage.updateBooking(selectedBookingForCompletion.id, updates);

    // Close modal and reset
    setShowCompleteModal(false);
    setSelectedBookingForCompletion(null);
    setAfterTaskPhoto(null);
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

  // Format countdown timer
  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-gray-500" />;
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
        return 'bg-orange-100 text-orange-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
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

  // Check approval status - show pending/rejected message
  if (worker.approvalStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">WorkerLink</h1>
                <span className="ml-4 text-sm text-gray-500">Worker Dashboard</span>
              </div>
              <Link to="/login" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                Logout
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
              <Clock className="h-10 w-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Pending Approval</h2>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800 mb-4">
              <Clock className="h-4 w-4 mr-2" />
              Status: Pending Panchayat Approval
            </div>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Thank you for registering with WorkerLink! Your registration is currently pending approval from the local Panchayat office.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>The Panchayat office will review your registration details</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>They may verify your documents and credentials</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>You will receive a notification once your registration is approved</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>After approval, you can start receiving booking requests from customers</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Applied on:</strong> {new Date(worker.appliedDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              You will be notified via email and SMS once your registration status changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (worker.approvalStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">WorkerLink</h1>
                <span className="ml-4 text-sm text-gray-500">Worker Dashboard</span>
              </div>
              <Link to="/login" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                Logout
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Not Approved</h2>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 mb-4">
              <XCircle className="h-4 w-4 mr-2" />
              Status: Rejected
            </div>
            <p className="text-gray-600 mb-6">
              Unfortunately, your registration was not approved by the Panchayat office.
            </p>
            {worker.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-red-900 mb-2">Reason for Rejection:</h3>
                <p className="text-sm text-red-800">{worker.rejectionReason}</p>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                What can you do?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Review the rejection reason above</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Contact the Panchayat office for more details</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Address the issues mentioned and reapply</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Ensure all your documents and credentials are valid</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => window.location.href = '/register'}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 hover:from-primary-600 hover:via-accent-500 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Reapply for Registration
            </button>
          </div>
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
              onClick={() => setActiveTab('statistics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'statistics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <span className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Statistics
              </span>
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
            {/* Sub-tabs for Active and Completed Bookings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex space-x-2 border-b border-gray-200">
                <button
                  onClick={() => setBookingsSubTab('active')}
                  className={`flex-1 py-3 px-6 font-semibold text-sm rounded-t-md transition-all duration-200 ${
                    bookingsSubTab === 'active'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Active Requests
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {bookings.filter(b => ['worker_assigned', 'accepted', 'in_progress'].includes(b.status)).length}
                  </span>
                </button>
                <button
                  onClick={() => setBookingsSubTab('completed')}
                  className={`flex-1 py-3 px-6 font-semibold text-sm rounded-t-md transition-all duration-200 ${
                    bookingsSubTab === 'completed'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Completed Bookings
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {bookings.filter(b => b.status === 'completed').length}
                  </span>
                </button>
              </div>
            </div>

            {/* Filtered Bookings List */}
            {bookings
              .filter(booking => {
                if (bookingsSubTab === 'active') {
                  return ['worker_assigned', 'accepted', 'in_progress'].includes(booking.status);
                } else {
                  return booking.status === 'completed';
                }
              })
              .map(booking => {
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

                      {/* Countdown Timer for Pending Worker Response */}
                      {booking.status === 'worker_assigned' && booking.responseDeadline && timeRemaining[booking.id] !== undefined && timeRemaining[booking.id] > 0 && (
                        <div className={`mb-3 p-3 rounded-lg border-2 ${
                          timeRemaining[booking.id] <= 5 * 60 * 1000
                            ? 'bg-red-50 border-red-300 animate-pulse'
                            : timeRemaining[booking.id] <= 10 * 60 * 1000
                            ? 'bg-orange-50 border-orange-300'
                            : 'bg-blue-50 border-blue-300'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Clock className={`h-5 w-5 mr-2 ${
                                timeRemaining[booking.id] <= 5 * 60 * 1000
                                  ? 'text-red-600'
                                  : timeRemaining[booking.id] <= 10 * 60 * 1000
                                  ? 'text-orange-600'
                                  : 'text-blue-600'
                              }`} />
                              <div>
                                <p className={`text-sm font-bold ${
                                  timeRemaining[booking.id] <= 5 * 60 * 1000
                                    ? 'text-red-900'
                                    : timeRemaining[booking.id] <= 10 * 60 * 1000
                                    ? 'text-orange-900'
                                    : 'text-blue-900'
                                }`}>
                                  {timeRemaining[booking.id] <= 5 * 60 * 1000
                                    ? '🚨 URGENT: Respond Now!'
                                    : timeRemaining[booking.id] <= 10 * 60 * 1000
                                    ? '⚠️ Please Respond Soon'
                                    : '⏰ Awaiting Your Response'
                                }
                                </p>
                                <p className={`text-xs ${
                                  timeRemaining[booking.id] <= 5 * 60 * 1000
                                    ? 'text-red-700'
                                    : timeRemaining[booking.id] <= 10 * 60 * 1000
                                    ? 'text-orange-700'
                                    : 'text-blue-700'
                                }`}>
                                  Time remaining: <span className="font-mono font-bold">{formatTimeRemaining(timeRemaining[booking.id])}</span>
                                </p>
                              </div>
                            </div>
                            <div className={`text-2xl font-mono font-bold ${
                              timeRemaining[booking.id] <= 5 * 60 * 1000
                                ? 'text-red-700'
                                : timeRemaining[booking.id] <= 10 * 60 * 1000
                                ? 'text-orange-700'
                                : 'text-blue-700'
                            }`}>
                              {formatTimeRemaining(timeRemaining[booking.id])}
                            </div>
                          </div>
                          <p className={`text-xs mt-2 ${
                            timeRemaining[booking.id] <= 5 * 60 * 1000
                              ? 'text-red-600'
                              : timeRemaining[booking.id] <= 10 * 60 * 1000
                              ? 'text-orange-600'
                              : 'text-blue-600'
                          }`}>
                            {timeRemaining[booking.id] <= 5 * 60 * 1000
                              ? '⚠️ This request will expire soon if you don\'t respond! Please accept or reject immediately.'
                              : 'Please accept or reject this booking request. The customer is waiting for your response.'
                            }
                          </p>
                        </div>
                      )}

                      {/* Expired Booking Message */}
                      {booking.status === 'expired' && (
                        <div className="mb-3 p-3 bg-gray-50 border-2 border-gray-300 rounded-lg">
                          <div className="flex items-center">
                            <XCircle className="h-5 w-5 mr-2 text-gray-600" />
                            <div>
                              <p className="text-sm font-bold text-gray-900">Request Expired</p>
                              <p className="text-xs text-gray-600">You did not respond within the 15-minute window. The customer has been notified.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-gray-600 mb-2">{booking.description}</p>

                      {/* Task Description */}
                      {booking.taskDescription && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <p className="text-xs font-medium text-gray-700 mb-1">Additional Details:</p>
                          <p className="text-sm text-gray-600">{booking.taskDescription}</p>
                        </div>
                      )}

                      {/* Photos Section */}
                      {booking.photos && (booking.photos.beforeTask || booking.photos.afterTask) && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {booking.photos.beforeTask && (
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                              <p className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Before Task Photo
                              </p>
                              <img
                                src={booking.photos.beforeTask.url}
                                alt="Before task"
                                className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(booking.photos!.beforeTask!.url, '_blank')}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Uploaded: {new Date(booking.photos.beforeTask.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {booking.photos.afterTask && (
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                              <p className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                After Task Photo
                              </p>
                              <img
                                src={booking.photos.afterTask.url}
                                alt="After task"
                                className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(booking.photos!.afterTask!.url, '_blank')}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Uploaded: {new Date(booking.photos.afterTask.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4 mt-3">
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
                              Customer Contact Information
                            </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-green-700 font-medium">Name:</span>
                                <span className="ml-2 text-green-900">{customer.name}</span>
                            </div>
                            <div>
                                <span className="text-green-700 font-medium">Phone:</span>
                                <a
                                  href={`tel:${customer.phone}`}
                                  className="ml-2 text-green-900 font-mono hover:text-green-700 underline"
                                >
                                  {customer.phone}
                                </a>
                            </div>
                            <div>
                                <span className="text-green-700 font-medium">Email:</span>
                                <span className="ml-2 text-green-900">{customer.email}</span>
                            </div>
                            <div>
                              <span className="text-green-700 font-medium">Gender:</span>
                              <span className="ml-2 text-green-900">{customer.gender}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-green-700 font-medium">Job Location:</span>
                              <span className="ml-2 text-green-900">{booking.location.address}</span>
                            </div>
                          </div>

                          {/* Privacy Protection Notice */}
                          <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                            <div className="flex items-start">
                              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="ml-3 flex-1">
                                <h6 className="text-sm font-semibold text-blue-900 flex items-center">
                                  Your Privacy is Protected
                                  <div className="ml-2 group relative">
                                    <Info className="h-4 w-4 text-blue-600 cursor-help" />
                                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                                      Customers contact you through our company number. Your personal number remains private.
                                    </div>
                                  </div>
                                </h6>
                                <div className="mt-2 space-y-1 text-xs text-blue-700">
                                  <p className="flex items-start">
                                    <Phone className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                    <span>
                                      <strong>Company Number:</strong> {booking.companyProxyNumber || COMPANY_PROXY_NUMBER}
                                    </span>
                                  </p>
                                  <p className="leading-relaxed">
                                    📞 Customers will call this company number to reach you. Your personal phone number
                                    is kept private for your security and safety.
                                  </p>
                                  <p className="text-blue-600 font-medium">
                                    ✓ You can call the customer directly using their number above
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-green-700 bg-green-100 p-2 rounded flex items-start">
                            <Info className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                            <span>
                              Contact details verified! You can call the customer directly to coordinate the job.
                              Customers will reach you through our company number.
                            </span>
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

                      <div className="flex flex-wrap gap-3 mt-4">
                        {(booking.status === 'pending_admin' || booking.status === 'worker_assigned') && (
                          <>
                            <button
                              onClick={() => handleBookingAction(booking.id, 'accept')}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t('btn.accept')}
                            </button>
                            <button
                              onClick={() => handleBookingAction(booking.id, 'reject')}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t('btn.reject')}
                            </button>
                          </>
                        )}

                        {booking.status === 'accepted' && (
                          <button
                            onClick={() => handleBookingAction(booking.id, 'complete')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('btn.mark_complete')}
                          </button>
                        )}

                        {canCancel(booking.status, booking.contactDetailsShared) && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                          >
                            {t('btn.cancel_booking')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {bookings.filter(booking => {
              if (bookingsSubTab === 'active') {
                return ['worker_assigned', 'accepted', 'in_progress'].includes(booking.status);
              } else {
                return booking.status === 'completed';
              }
            }).length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {bookingsSubTab === 'active' ? 'No Active Requests' : 'No Completed Bookings'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {bookingsSubTab === 'active'
                    ? 'You don\'t have any active booking requests at the moment'
                    : 'You haven\'t completed any bookings yet'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && statistics && (
          <div className="space-y-6">
            {/* Performance Badge */}
            {(() => {
              const badge = getPerformanceBadge(statistics);
              return badge ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className={`inline-flex items-center px-6 py-3 rounded-full text-white font-bold text-lg ${badge.color} shadow-lg`}>
                    <span className="text-2xl mr-2">{badge.icon}</span>
                    {badge.label}
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    You're doing great! Keep up the excellent work.
                  </p>
                </div>
              ) : null;
            })()}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Tasks Completed */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{statistics.totalTasksCompleted}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  {statistics.totalTasksInProgress} in progress
                </p>
              </div>

              {/* Average Rating */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className={`mt-2 text-3xl font-bold ${getRatingColor(statistics.averageRating)}`}>
                      {statistics.averageRating.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Star className="h-8 w-8 text-yellow-600 fill-current" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  From {statistics.totalReviews} review{statistics.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Total Earnings */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">₹{statistics.totalEarnings.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  From completed bookings
                </p>
              </div>

              {/* Success Rate */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className={`mt-2 text-3xl font-bold ${getRatingColor(statistics.successRate / 20)}`}>
                      {statistics.successRate}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${getSuccessRateColor(statistics.successRate).replace('text-', 'bg-').replace('600', '100')}`}>
                    <Target className={`h-8 w-8 ${getSuccessRateColor(statistics.successRate).split(' ')[0]}`} />
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  {statistics.totalTasksAssigned} task{statistics.totalTasksAssigned !== 1 ? 's' : ''} assigned
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Tasks Chart */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Tasks Completed (Last 6 Months)</h3>
                </div>
                <div className="space-y-3">
                  {statistics.monthlyTasksCompleted.map((month) => {
                    const maxCount = Math.max(...statistics.monthlyTasksCompleted.map(m => m.count), 1);
                    const percentage = (month.count / maxCount) * 100;
                    return (
                      <div key={month.month} className="flex items-center">
                        <div className="w-16 text-sm font-medium text-gray-600">{month.month}</div>
                        <div className="flex-1 mx-3">
                          <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%` }}
                            >
                              {month.count > 0 && (
                                <span className="text-xs font-bold text-white">{month.count}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <Award className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Rating Distribution</h3>
                </div>
                <div className="space-y-3">
                  {statistics.ratingDistribution.slice().reverse().map((item) => {
                    const maxCount = Math.max(...statistics.ratingDistribution.map(r => r.count), 1);
                    const percentage = statistics.totalReviews > 0 ? (item.count / statistics.totalReviews) * 100 : 0;
                    return (
                      <div key={item.rating} className="flex items-center">
                        <div className="w-20 flex items-center text-sm font-medium text-gray-600">
                          {item.rating} <Star className="h-4 w-4 ml-1 text-yellow-500 fill-current" />
                        </div>
                        <div className="flex-1 mx-3">
                          <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%` }}
                            >
                              {item.count > 0 && (
                                <span className="text-xs font-bold text-gray-900">{item.count}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-12 text-sm text-gray-600 text-right">{percentage.toFixed(0)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Task Status Distribution */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <PieChart className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Task Status Breakdown</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900">{statistics.totalTasksCompleted}</p>
                  <p className="text-sm text-green-700 mt-1">Completed</p>
                </div>
                <div className="text-center p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{statistics.totalTasksInProgress}</p>
                  <p className="text-sm text-blue-700 mt-1">In Progress</p>
                </div>
                <div className="text-center p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                  <XCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalTasksCancelled}</p>
                  <p className="text-sm text-gray-700 mt-1">Cancelled</p>
                </div>
                <div className="text-center p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-900">{statistics.totalTasksRejected}</p>
                  <p className="text-sm text-red-700 mt-1">Rejected/Expired</p>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`bg-white rounded-lg shadow-sm border-2 p-6 ${getSuccessRateColor(statistics.acceptanceRate)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Acceptance Rate</p>
                    <p className="mt-2 text-3xl font-bold">{statistics.acceptanceRate}%</p>
                    <p className="mt-2 text-xs">
                      You accepted {statistics.totalTasksAssigned - statistics.totalTasksRejected} out of {statistics.totalTasksAssigned} assignments
                    </p>
                  </div>
                  <TrendingUp className="h-12 w-12 opacity-50" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Performance Summary</p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        {statistics.totalTasksCompleted} completed task{statistics.totalTasksCompleted !== 1 ? 's' : ''}
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-2 fill-current" />
                        {statistics.averageRating.toFixed(1)} average rating
                      </li>
                      <li className="flex items-center">
                        <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                        ₹{statistics.totalEarnings.toLocaleString()} earned
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                <button
                  onClick={() => setShowProfileEdit(!showProfileEdit)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                >
                  <Settings className="h-4 w-4 mr-2" />
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

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowProfileEdit(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 text-white py-2.5 px-4 rounded-md hover:from-primary-600 hover:via-accent-500 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
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

      {/* Complete Booking Modal */}
      {showCompleteModal && selectedBookingForCompletion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Complete Booking: {selectedBookingForCompletion.task}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    After Task Photo <span className="text-gray-500 text-xs">(Optional, Recommended)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleAfterPhotoChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload a photo showing the completed work. Max 5MB, JPEG/PNG only.
                  </p>
                  {afterTaskPhoto && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {afterTaskPhoto.name} ({(afterTaskPhoto.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                {/* Show before photo if exists */}
                {selectedBookingForCompletion.photos?.beforeTask && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-xs font-medium text-gray-700 mb-2">Before Task Photo:</p>
                    <img
                      src={selectedBookingForCompletion.photos.beforeTask.url}
                      alt="Before task"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    📸 Uploading an "after" photo helps build trust with customers and showcases your quality work!
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompleteModal(false);
                      setSelectedBookingForCompletion(null);
                      setAfterTaskPhoto(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteBooking}
                    className="flex-1 bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500 text-white py-2.5 px-4 rounded-md hover:from-primary-600 hover:via-accent-500 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Mark as Complete
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

export default WorkerDashboard;
