const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(identifier, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // User methods
  async getUsers() {
    return this.request('/users');
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, updates) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Worker methods
  async getWorkers() {
    return this.request('/workers');
  }

  async getWorker(id) {
    return this.request(`/workers/${id}`);
  }

  async updateWorker(id, updates) {
    return this.request(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async verifyWorker(id, isVerified) {
    return this.request(`/workers/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified }),
    });
  }

  // Customer methods
  async getCustomers() {
    return this.request('/customers');
  }

  async getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  async updateCustomer(id, updates) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Booking methods
  async getBookings() {
    return this.request('/bookings');
  }

  async getBookingsByUser(userId) {
    return this.request(`/bookings/user/${userId}`);
  }

  async getBooking(id) {
    return this.request(`/bookings/${id}`);
  }

  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async updateBooking(id, updates) {
    return this.request(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async verifyBooking(id, adminVerification, adminNotes) {
    return this.request(`/bookings/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ adminVerification, adminNotes }),
    });
  }

  // Review methods
  async getReviewsByWorker(workerId) {
    return this.request(`/reviews/worker/${workerId}`);
  }

  async createReview(reviewData) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Notification methods
  async getNotificationsByUser(userId) {
    return this.request(`/notifications/user/${userId}`);
  }

  async markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async createNotification(notificationData) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  // Help request methods
  async getHelpRequests() {
    return this.request('/help');
  }

  async getHelpRequestsByUser(userId) {
    return this.request(`/help/user/${userId}`);
  }

  async getHelpRequest(id) {
    return this.request(`/help/${id}`);
  }

  async createHelpRequest(helpRequestData) {
    return this.request('/help', {
      method: 'POST',
      body: JSON.stringify(helpRequestData),
    });
  }

  async updateHelpRequestStatus(id, status, adminResponse) {
    return this.request(`/help/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminResponse }),
    });
  }

  async assignHelpRequest(id, adminId) {
    return this.request(`/help/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ adminId }),
    });
  }
}

export default new ApiService();