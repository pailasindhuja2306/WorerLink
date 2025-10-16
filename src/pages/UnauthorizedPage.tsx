import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 shadow rounded-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You do not have permission to view this page.</p>
        <div className="space-x-3">
          <Link
            to="/login"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Go to Login
          </Link>
          <Link
            to="/"
            className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
