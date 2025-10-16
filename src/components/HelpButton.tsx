import React, { useState } from 'react';
import { HelpCircle, MessageCircle, AlertTriangle, Bug, QuestionMarkCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface HelpButtonProps {
  className?: string;
}

const HelpButton: React.FC<HelpButtonProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'help',
    subject: '',
    description: '',
    priority: 'medium'
  });
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await apiService.createHelpRequest({
        userId: user.id,
        userType: user.type,
        ...formData
      });

      alert('Your help request has been submitted! An admin will respond soon.');
      setFormData({
        type: 'help',
        subject: '',
        description: '',
        priority: 'medium'
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting help request:', error);
      alert('Failed to submit help request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 ${className}`}
        title="Get Help or Report Issue"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-blue-600" />
                Help & Support
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Request
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'help', label: 'General Help', icon: QuestionMarkCircle, color: 'blue' },
                    { value: 'complaint', label: 'Complaint', icon: AlertTriangle, color: 'red' },
                    { value: 'technical_issue', label: 'Technical Issue', icon: Bug, color: 'yellow' },
                    { value: 'general_inquiry', label: 'General Inquiry', icon: MessageCircle, color: 'green' }
                  ].map(({ value, label, icon: Icon, color }) => (
                    <label
                      key={value}
                      className={`relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        formData.type === value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={value}
                        checked={formData.type === value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <Icon className={`h-5 w-5 mr-2 text-${color}-600`} />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low - General question</option>
                  <option value="medium">Medium - Important issue</option>
                  <option value="high">High - Urgent problem</option>
                  <option value="urgent">Urgent - Critical issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="Brief description of your issue"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Please provide detailed information about your issue or question..."
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your request will be sent to our admin team</li>
                  <li>• An admin will review and respond within 24 hours</li>
                  <li>• You'll receive notifications about status updates</li>
                  <li>• For urgent issues, we'll prioritize your request</li>
                </ul>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.subject || !formData.description}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton;