import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 shadow rounded-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-6">The page you are looking for doesn’t exist.</p>
        <Link
          to="/"
          className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
