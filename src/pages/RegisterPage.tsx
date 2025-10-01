import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Worker, Customer } from '../types';
import { districts, categories, professions, skillsByCategory } from '../data/mockData';
import { Users, UserCheck, Shield } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [userType, setUserType] = useState<'customer' | 'worker' | 'admin'>('customer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    district: '',
    gender: 'male' as 'male' | 'female' | 'other',
    password: '',
    confirmPassword: '',
    // Worker specific fields
    profession: '',
    category: '',
    skills: [] as string[],
    experience: 0,
    hourlyRate: 0,
    bio: '',
    maxDistance: 10,
  });
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // In a real app, you'd use a reverse geocoding service
          setCurrentLocation({
            latitude,
            longitude,
            address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your current location. Please enter manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
        type === 'number' ? Number(value) : value
    }));

    // Update available skills when profession changes
    if (name === 'profession') {
      const selectedProfession = professions.find(p => p.name === value);
      if (selectedProfession) {
        const skills = skillsByCategory[selectedProfession.category] || [];
        setAvailableSkills(skills);
        // Clear selected skills when profession changes
        setFormData(prev => ({ ...prev, skills: [] }));
      }
    }
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skill = e.target.value;
    if (e.target.checked) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s !== skill)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const userData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        district: formData.district,
        gender: formData.gender,
        currentLocation: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: currentLocation.address,
          lastUpdated: new Date()
        } : undefined,
        type: userType,
      };

      if (userType === 'worker') {
        const workerData: Partial<Worker> = {
          ...userData,
          type: 'worker',
          profession: formData.profession,
          category: formData.category,
          skills: formData.skills,
          experience: formData.experience,
          hourlyRate: formData.hourlyRate,
          bio: formData.bio,
        };
        const success = await register(workerData);
        if (success) {
          navigate('/worker');
        } else {
          setError('Registration failed. Email might already exist.');
        }
      } else if (userType === 'admin') {
        const adminData: Partial<User> = {
          ...userData,
          type: 'admin',
        };
        const success = await register(adminData);
        if (success) {
          navigate('/admin');
        } else {
          setError('Registration failed. Email might already exist.');
        }
      } else {
        const customerData: Partial<Customer> = {
          ...userData,
          type: 'customer',
        };
        const success = await register(customerData);
        if (success) {
          navigate('/customer');
        } else {
          setError('Registration failed. Email might already exist.');
        }
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Join WorkerLink
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to get started
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10">
          {/* User Type Selection */}
          <div className="mb-6">
            <label className="text-base font-medium text-gray-900">I want to register as:</label>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setUserType('customer')}
                className={`relative rounded-lg border p-4 focus:outline-none ${userType === 'customer'
                  ? 'border-primary-500 ring-2 ring-primary-500'
                  : 'border-gray-300'
                  }`}
              >
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-primary-600" />
                  <span className="ml-3 block text-sm font-medium">Customer</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Find and book skilled workers</p>
              </button>

              <button
                type="button"
                onClick={() => setUserType('worker')}
                className={`relative rounded-lg border p-4 focus:outline-none ${userType === 'worker'
                  ? 'border-primary-500 ring-2 ring-primary-500'
                  : 'border-gray-300'
                  }`}
              >
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-primary-600" />
                  <span className="ml-3 block text-sm font-medium">Worker</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Offer your services to customers</p>
              </button>

              <button
                type="button"
                onClick={() => setUserType('admin')}
                className={`relative rounded-lg border p-4 focus:outline-none ${userType === 'admin'
                  ? 'border-primary-500 ring-2 ring-primary-500'
                  : 'border-gray-300'
                  }`}
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-primary-600" />
                  <span className="ml-3 block text-sm font-medium">Admin</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Manage platform and verify bookings</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  name="gender"
                  id="gender"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                  District
                </label>
                <select
                  name="district"
                  id="district"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.district}
                  onChange={handleInputChange}
                >
                  <option value="">Select District</option>
                  {districts.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.name}, {district.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Location
                </label>
                <div className="mt-1 flex space-x-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    📍 Get Current Location
                  </button>
                </div>
                {currentLocation && (
                  <p className="mt-1 text-xs text-gray-500">
                    Location: {currentLocation.address}
                  </p>
                )}
              </div>
            </div>

            {/* Worker Specific Fields */}
            {userType === 'worker' && (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="profession" className="block text-sm font-medium text-gray-700">
                      Profession
                    </label>
                    <select
                      name="profession"
                      id="profession"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.profession}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Profession</option>
                      {professions.map(profession => (
                        <option key={profession.id} value={profession.name}>
                          {profession.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      name="category"
                      id="category"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="experience"
                      id="experience"
                      min="0"
                      max="50"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.experience}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                      Hourly Rate (₹)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      id="hourlyRate"
                      min="0"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                    {formData.profession && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Select skills for {formData.profession})
                      </span>
                    )}
                  </label>
                  {formData.profession ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSkills.map(skill => (
                        <label key={skill} className="flex items-center">
                          <input
                            type="checkbox"
                            value={skill}
                            checked={formData.skills.includes(skill)}
                            onChange={handleSkillsChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{skill}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Please select a profession first to see available skills
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    id="bio"
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about your experience and expertise..."
                  />
                </div>
              </>
            )}

            {/* Admin Specific Fields */}
            {userType === 'admin' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Admin Registration</h3>
                <p className="text-sm text-blue-700 mb-4">
                  As an admin, you will have access to:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Verify and manage worker registrations</li>
                  <li>• Review and verify customer bookings</li>
                  <li>• Assign workers to verified bookings</li>
                  <li>• Monitor platform analytics and revenue</li>
                  <li>• Manage disputes and customer support</li>
                </ul>
                <div className="mt-4 p-3 bg-yellow-100 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Admin accounts require special approval.
                    Your registration will be reviewed before activation.
                  </p>
                </div>
              </div>
            )}


            {/* Password Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
