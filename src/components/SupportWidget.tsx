import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SupportRequest } from '../types';
import { storage } from '../utils/storage';

const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();

  // user.role may not be present on the User type; compute at runtime
  const isAdmin = !!user && (user as any).role === 'admin';

  // Hide support widget for admins (they have a dedicated support panel in admin dashboard)
  if (!user || isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !user || isAdmin) {
      return;
    }

    setIsSubmitting(true);

    // Create support request object
    const supportRequest: SupportRequest = {
      id: `req_${Date.now()}`,
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      message: message.trim(),
      status: 'pending',
      createdAt: new Date(),
    };

    // Store support request in storage
    const allRequests = localStorage.getItem('supportRequests');
    const requests = allRequests ? JSON.parse(allRequests) : [];
    requests.push(supportRequest);
    localStorage.setItem('supportRequests', JSON.stringify(requests));

    // Create notification for admin
    const notification = {
      id: `support_${Date.now()}`,
      userId: 'admin', // Route to admin
      title: `Support Request from ${user?.name}`,
      message: `${user?.name} (${(user as any).role}) has submitted a support request: "${message.trim().substring(0, 50)}..."`,
      type: 'system' as const,
      isRead: false,
      createdAt: new Date(),
    };
    storage.addNotification(notification);

    console.log('Support Request:', supportRequest);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setMessage('');

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Support Request Panel */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex justify-between items-center">
            <h3 className="text-white font-semibold text-lg">Contact Admin</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {showSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted!</h4>
                <p className="text-gray-600 text-sm">We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="block mb-2">
                  <span className="text-gray-700 text-sm font-medium">Your Query</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or question..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={4}
                    required
                    disabled={isSubmitting}
                  />
                </label>

                {user && (
                  <div className="mb-3 text-xs text-gray-500">
                    Submitting as: <span className="font-medium">{user.name}</span> ({user.email})
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="Open support widget"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default SupportWidget;
