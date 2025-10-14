import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Worker, Customer } from '../types';
import { storage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User>) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): React.ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize storage with mock data
    storage.initializeWithMockData();

    // Check for existing user session
    const currentUser = storage.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const users = storage.getUsers();
      const normalized = email.trim().toLowerCase();
      const foundUser = users.find(u => (u.email || '').trim().toLowerCase() === normalized);

      if (foundUser) {
        // In a real app, you'd verify the password hash
        // For demo purposes, we'll accept any password
        setUser(foundUser);
        storage.setCurrentUser(foundUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const users = storage.getUsers();
      const normalizedEmail = (userData.email || '').trim().toLowerCase();
      const existingUser = users.find(u => (u.email || '').trim().toLowerCase() === normalizedEmail);

      if (existingUser) {
        return false; // User already exists
      }

      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name || '',
        username: (userData as any).username || (userData.email ? (userData.email.split('@')[0] || '') : ''),
        email: normalizedEmail,
        phone: userData.phone || '',
        district: userData.district || '',
        type: userData.type || 'customer',
        gender: userData.gender || 'male',
        createdAt: new Date(),
      };

      // Add to appropriate storage based on user type
      if (newUser.type === 'worker') {
        const workerData = userData as Partial<Worker>;
        const newWorker: Worker = {
          ...newUser,
          type: 'worker',
          profession: workerData.profession || '',
          category: workerData.category || '',
          skills: workerData.skills || [],
          experience: workerData.experience || 0,
          hourlyRate: workerData.hourlyRate || 0,
          availability: 'available',
          rating: 0,
          totalJobs: 0,
          bio: workerData.bio || '',
          isVerified: false,
          
        };
        storage.addWorker(newWorker);
        storage.addUser(newWorker);

        // Add notification for all customers about new worker
        const customers = storage.getCustomers();
        customers.forEach(customer => {
          const notification = {
            id: Date.now().toString() + Math.random(),
            userId: customer.id,
            title: 'New Worker Available',
            message: `${newWorker.name} (${newWorker.profession}) is now available in your area!`,
            type: 'system' as const,
            isRead: false,
            createdAt: new Date(),
          };
          storage.addNotification(notification);
        });

        console.log('New worker registered:', newWorker.name); // Debug log
      } else if (newUser.type === 'customer') {
        const customerData = userData as Partial<Customer>;
        const newCustomer: Customer = {
          ...newUser,
          type: 'customer',
          preferences: customerData.preferences || {
            maxDistance: 10,
          },
        };
        storage.addCustomer(newCustomer);
        storage.addUser(newCustomer);
      } else if (newUser.type === 'admin') {
        // Persist admin user so they can login later
        storage.addUser(newUser);
      }

      setUser(newUser);
      storage.setCurrentUser(newUser);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    storage.setCurrentUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      storage.setCurrentUser(updatedUser);
      storage.updateUser(user.id, updates);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};