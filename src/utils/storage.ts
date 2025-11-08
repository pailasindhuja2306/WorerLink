import { User, Worker, Customer, Booking, Notification } from '../types';

const STORAGE_KEYS = {
  USERS: 'labourlink_users',
  WORKERS: 'labourlink_workers',
  CUSTOMERS: 'labourlink_customers',
  BOOKINGS: 'labourlink_bookings',
  NOTIFICATIONS: 'labourlink_notifications',
  CURRENT_USER: 'labourlink_current_user',
} as const;

export const storage = {
  // Users
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  setUsers: (users: User[]): void => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  addUser: (user: User): void => {
    const users = storage.getUsers();
    users.push(user);
    storage.setUsers(users);
  },

  updateUser: (userId: string, updates: Partial<User>): void => {
    const users = storage.getUsers();
    const index = users.findIndex(user => user.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      storage.setUsers(users);
    }
  },

  // Workers
  getWorkers: (): Worker[] => {
    const data = localStorage.getItem(STORAGE_KEYS.WORKERS);
    return data ? JSON.parse(data) : [];
  },

  setWorkers: (workers: Worker[]): void => {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
  },

  addWorker: (worker: Worker): void => {
    const workers = storage.getWorkers();
    workers.push(worker);
    storage.setWorkers(workers);
  },

  updateWorker: (workerId: string, updates: Partial<Worker>): void => {
    const workers = storage.getWorkers();
    const index = workers.findIndex(worker => worker.id === workerId);
    if (index !== -1) {
      workers[index] = { ...workers[index], ...updates };
      storage.setWorkers(workers);
    }
  },

  // Customers
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },

  setCustomers: (customers: Customer[]): void => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  addCustomer: (customer: Customer): void => {
    const customers = storage.getCustomers();
    customers.push(customer);
    storage.setCustomers(customers);
  },

  updateCustomer: (customerId: string, updates: Partial<Customer>): void => {
    const customers = storage.getCustomers();
    const index = customers.findIndex(customer => customer.id === customerId);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updates };
      storage.setCustomers(customers);
    }
  },

  // Bookings
  getBookings: (): Booking[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  },

  setBookings: (bookings: Booking[]): void => {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  },

  addBooking: (booking: Booking): void => {
    const bookings = storage.getBookings();
    bookings.push(booking);
    storage.setBookings(bookings);
  },

  updateBooking: (bookingId: string, updates: Partial<Booking>): void => {
    const bookings = storage.getBookings();
    const index = bookings.findIndex(booking => booking.id === bookingId);
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...updates, updatedAt: new Date() };
      storage.setBookings(bookings);
    }
  },

  // Notifications
  getNotifications: (): Notification[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  },

  setNotifications: (notifications: Notification[]): void => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  addNotification: (notification: Notification): void => {
    const notifications = storage.getNotifications();
    notifications.push(notification);
    storage.setNotifications(notifications);
  },

  markNotificationAsRead: (notificationId: string): void => {
    const notifications = storage.getNotifications();
    const index = notifications.findIndex(notif => notif.id === notificationId);
    if (index !== -1) {
      notifications[index].isRead = true;
      storage.setNotifications(notifications);
    }
  },

  // Current User
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // Utility functions
  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  initializeWithMockData: (): void => {
    // Initialize with mock data: merge mock users/bookings into existing storage without duplicating
    try {
      const { mockWorkers, mockCustomers, mockBookings, mockAdmin } = require('../data/mockData');

      const existingUsers = storage.getUsers();

      const usersToAdd: User[] = [];
      // Use phone as the unique identifier since we switched to mobile authentication
      mockWorkers.forEach((w: User) => {
        if (!existingUsers.some(u => u.phone === w.phone || u.email === w.email)) usersToAdd.push(w);
      });
      mockCustomers.forEach((c: User) => {
        if (!existingUsers.some(u => u.phone === c.phone || u.email === c.email)) usersToAdd.push(c);
      });
      if (!existingUsers.some(u => u.phone === mockAdmin.phone || u.email === mockAdmin.email)) {
        usersToAdd.push(mockAdmin);
      }

      if (existingUsers.length === 0 && usersToAdd.length > 0) {
        storage.setUsers([...usersToAdd]);
      } else if (usersToAdd.length > 0) {
        storage.setUsers([...existingUsers, ...usersToAdd]);
      }

      // Ensure workers list contains mock workers
      const existingWorkers = storage.getWorkers();
      const workersToAdd = mockWorkers.filter((w: Worker) => !existingWorkers.some(ew => ew.phone === w.phone || ew.email === w.email));
      if (existingWorkers.length === 0 && mockWorkers.length > 0) {
        storage.setWorkers([...mockWorkers]);
      } else if (workersToAdd.length > 0) {
        storage.setWorkers([...existingWorkers, ...workersToAdd]);
      }

      // Ensure customers list contains mock customers
      const existingCustomers = storage.getCustomers();
      const customersToAdd = mockCustomers.filter((c: Customer) => !existingCustomers.some(ec => ec.phone === c.phone || ec.email === c.email));
      if (existingCustomers.length === 0 && mockCustomers.length > 0) {
        storage.setCustomers([...mockCustomers]);
      } else if (customersToAdd.length > 0) {
        storage.setCustomers([...existingCustomers, ...customersToAdd]);
      }

      // Add mock bookings only if bookings storage is empty
      if (storage.getBookings().length === 0 && mockBookings && mockBookings.length > 0) {
        storage.setBookings(mockBookings);
      }
    } catch (err) {
      console.error('Error initializing mock data:', err);
    }
  },
};
