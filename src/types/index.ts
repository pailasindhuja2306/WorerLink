export interface User {
  role: string;
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  district: string;
  gender: 'male' | 'female' | 'other';
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: Date;
  };
  locationSharingEnabled?: boolean; // For live location sharing
  type: 'customer' | 'worker' | 'admin';
  createdAt: Date;
}

export interface Worker extends User {
  type: 'worker';
  profession: string;
  category: string;
  skills: string[];
  experience: number; // years
  hourlyRate: number;
  availability: 'available' | 'busy' | 'offline';
  rating: number;
  totalJobs: number;
  bio: string;
  profileImage?: string;
  isVerified: boolean;
  reviews?: Review[];
  // Panchayat approval fields
  approvalStatus: 'pending' | 'approved' | 'rejected';
  panchayatApprovalDate?: Date;
  rejectionReason?: string;
  appliedDate: Date;

}

export interface Customer extends User {
  type: 'customer';
  preferences: {
    maxDistance: number;
  };
}

export interface Booking {
  id: string;
  customerId: string;
  workerId?: string; // Optional until admin assigns
  task: string;
  description: string;
  scheduledDate: Date;
  estimatedDuration: number; // hours
  status: 'pending_admin' | 'admin_verified' | 'worker_assigned' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  paymentMethod?: string; // Payment method selected by customer (PhonePe, Net Banking, Cash on Delivery)
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  responseDeadline?: Date; // 15-minute deadline for worker to respond
  workerResponseTime?: Date; // When worker actually accepted/rejected
  remindersSent?: {
    oneHour: boolean;
    thirtyMin: boolean;
  };

  location: {
    address: string;
    district: string;
    latitude?: number;
    longitude?: number;
  };
  liveLocationSharing?: {
    enabled: boolean;
    customerLocation?: {
      latitude: number;
      longitude: number;
      address: string;
      lastUpdated: Date;
    };
    workerLocation?: {
      latitude: number;
      longitude: number;
      address: string;
      lastUpdated: Date;
    };
  };
  adminNotes?: string;
  contactDetailsShared?: boolean; // Flag to indicate if contact details have been shared
  adminVerification?: {
    customerVerified: boolean;
    workerVerified: boolean;
    adminId: string;
    verifiedAt: Date;
    callNotes: string;
  };
  // Photo upload fields
  photos?: {
    beforeTask?: {
      url: string; // base64 encoded image or URL
      uploadedAt: Date;
      uploadedBy: string; // userId
      fileName: string;
      fileSize: number; // in bytes
    };
    afterTask?: {
      url: string; // base64 encoded image or URL
      uploadedAt: Date;
      uploadedBy: string; // userId
      fileName: string;
      fileSize: number; // in bytes
    };
  };
  taskDescription?: string; // Additional detailed task description
  companyProxyNumber?: string; // Company-provided phone number for privacy-protected communication
}

export interface Review {
  id: string;
  workerId: string;
  customerId: string;
  bookingId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'status_update' | 'system' | 'booking_timeout' | 'task_reminder_1hr' | 'task_reminder_30min';
  isRead: boolean;
  createdAt: Date;
  bookingId?: string;
}

export interface District {
  id: string;
  name: string;
  state: string;
}

export interface Profession {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface WorkerStatistics {
  totalTasksCompleted: number;
  totalTasksInProgress: number;
  totalTasksCancelled: number;
  totalTasksRejected: number;
  averageRating: number;
  totalReviews: number;
  totalEarnings: number;
  successRate: number; // Percentage of completed tasks out of total assigned
  totalTasksAssigned: number;
  acceptanceRate: number; // Percentage of accepted tasks out of total assigned
  monthlyTasksCompleted: { month: string; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
}

export interface SupportRequest {
  id: string;
  userId?: string; // Optional if user is not logged in
  userName?: string;
  userEmail?: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
}

export type UserType = 'customer' | 'worker' | 'admin';
export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
export type WorkerAvailability = 'available' | 'busy' | 'offline';
