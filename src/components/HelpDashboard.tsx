import React, { useState, useEffect } from 'react';
import { MessageCircle, AlertTriangle, Bug, QuestionMarkCircle, Clock, CheckCircle, XCircle, User, Calendar, Filter } from 'lucide-react';
import apiService from '../services/api';

interface HelpRequest {
  _id: string;
  userId: string;
  userType: 'customer' | 'worker';
  type: 'complaint' | 'help' | 'technical_issue' | 'general_inquiry';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminId?: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  bookingId?: string;
}

const HelpDashboard: React.FC = () => {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [filter, setFilter] = useState({
    status: 'all',
    type: 'all',
    priority: 'all'
  });
  const [adminResponse, setAdminResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHelpRequests();
  }, []);

  const loadHelpRequests = async () => {
    try {
      const requests = await apiService.getHelpRequests();
      setHelpRequests(requests);
    } catch (error) {
      console.error('Error loading help requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string) => {
    try {
      await apiService.updateHelpRequestStatus(requestId, status, adminResponse);
      setAdminResponse('');
      setSelectedRequest(null);
      loadHelpRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-orange-100 text-orange-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'complaint':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'help':
        return <QuestionMarkCircle className="h-4 w-4 text-blue-500" />;
      case 'technical_issue':
        return <Bug className="h-4 w-4 text-yellow-500" />;
      case 'general_inquiry':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredRequests = helpRequests.filter(request => {
    if (filter.status !== 'all' && request.status !== filter.status) return false;
    if (filter.type !== 'all' && request.type !== filter.type) return false;
    if (filter.priority !== 'all' && request.priority !== filter.priority) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <MessageCircle className="h-6 w-6 mr-2 text-blue-600" />
          Help Requests & Complaints
        </h2>
        <div className="text-sm text-gray-500">
          {filteredRequests.length} of {helpRequests.length} requests
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="complaint">Complaint</option>
              <option value="help">Help</option>
              <option value="technical_issue">Technical Issue</option>
              <option value="general_inquiry">General Inquiry</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Help Requests List */}
      <div className="space-y-4">
        {filteredRequests.map(request => (
          <div key={request._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  {getTypeIcon(request.type)}
                  <h3 className="text-lg font-medium text-gray-900 ml-2">{request.subject}</h3>
                  <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                  </span>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{request.description}</p>

                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {request.userType} • {request.userId}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                  {request.bookingId && (
                    <div className="text-blue-600">
                      Related to Booking: {request.bookingId}
                    </div>
                  )}
                </div>

                {request.adminResponse && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-1">Admin Response:</h5>
                    <p className="text-sm text-blue-800">{request.adminResponse}</p>
                  </div>
                )}
              </div>

              <div className="ml-4 flex space-x-2">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Respond
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No help requests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {helpRequests.length === 0 ? 'No help requests have been submitted yet.' : 'Try adjusting your filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Respond to Help Request</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{selectedRequest.subject}</h4>
                <p className="text-sm text-gray-600">{selectedRequest.description}</p>
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span>Type: {selectedRequest.type}</span>
                  <span>Priority: {selectedRequest.priority}</span>
                  <span>User: {selectedRequest.userType}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Response
                </label>
                <textarea
                  rows={4}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Enter your response to the user..."
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedRequest._id, 'in_progress')}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Mark as In Progress
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedRequest._id, 'resolved')}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpDashboard;