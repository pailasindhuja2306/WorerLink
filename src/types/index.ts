export interface User {
  id: string;
  name: string;
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
  status: 'pending_admin' | 'admin_verified' | 'worker_assigned' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  paymentMethod: 'cash';
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  
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
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'status_update' | 'system';
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

export type UserType = 'customer' | 'worker' | 'admin';
export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
export type WorkerAvailability = 'available' | 'busy' | 'offline';
