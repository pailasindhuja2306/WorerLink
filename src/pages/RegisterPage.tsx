import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Worker, Customer } from '../types';
import { User } from "../data/mockData";
import { districts, categories, professions, skillsByCategory } from '../data/mockData';
import { Users, UserCheck, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../asserts/skillconnect.png';

const RegisterPage: React.FC = () => {
  const [userType, setUserType] = useState<'customer' | 'worker'>('customer');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    district: districts[0]?.id || '',
    gender: 'male' as 'male' | 'female' | 'other',
    password: '',
    confirmPassword: '',
    // Worker specific fields
    profession: '',
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
  const { t } = useLanguage();

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
          setError(t('error.location_unavailable'));
        }
      );
    } else {
      setError(t('error.geolocation_unsupported'));
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
      setError(t('error.password_mismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('error.password_short'));
      return;
    }

    setIsLoading(true);

    try {
      const userData: Partial<User> = {
        name: formData.name,
        username: formData.username,
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
          skills: formData.skills,
          experience: formData.experience,
          hourlyRate: formData.hourlyRate,
          bio: formData.bio,
          // Panchayat approval fields - new workers start as pending
          approvalStatus: 'pending',
          appliedDate: new Date(),
        };
        const success = await register(workerData);
        if (success) {
          navigate('/worker');
        } else {
          setError(t('error.registration_failed'));
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
          setError(t('error.registration_failed'));
        }
      }
    } catch (err) {
      setError(t('error.registration_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <img className="h-16 w-16" src={Logo} alt="skillconnect Logo" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('register.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('register.subtitle')}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10">
          {/* User Type Selection */}
          <div className="mb-6">
            <label className="text-base font-medium text-gray-900">{t('register.i_want')}</label>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <span className="ml-3 block text-sm font-medium">{t('role.customer')}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">{t('register.find_and_book')}</p>
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
                  <span className="ml-3 block text-sm font-medium">{t('role.worker')}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">{t('register.offer_services')}</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {t('label.full_name')}
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
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  {t('label.username')}
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('label.email')}
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
                  {t('label.phone')}
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
                  {t('label.gender')}
                </label>
                <select
                  name="gender"
                  id="gender"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="male">{t('gender.male')}</option>
                  <option value="female">{t('gender.female')}</option>
                  <option value="other">{t('gender.other')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                  {t('label.district')}
                </label>
                <select
                  name="district"
                  id="district"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.district}
                  onChange={handleInputChange}
                  disabled
                >
                  <option value="">{t('select.district')}</option>
                  {districts.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.name}, {district.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('label.current_location')}
                </label>
                <div className="mt-1 flex space-x-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    {t('btn.get_current_location')}
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
                      {t('label.profession')}
                    </label>
                    <select
                      name="profession"
                      id="profession"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.profession}
                      onChange={handleInputChange}
                    >
                      <option value="">{t('select.profession')}</option>
                      {professions.map(profession => (
                        <option key={profession.id} value={profession.name}>
                          {profession.name}
                        </option>
                      ))}
                    </select>
                  </div>


                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                      {t('label.experience')}
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
                      {t('label.hourly_rate')}
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
                    {t('label.skills')}
                    {formData.profession && (
                      <span className="text-xs text-gray-500 ml-2">
                        {t('skills.select_for').replace('{profession}', formData.profession)}
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
                      {t('msg.select_profession_first')}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    {t('label.bio')}
                  </label>
                  <textarea
                    name="bio"
                    id="bio"
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder={t('bio.placeholder')}
                  />
                </div>
              </>
            )}




            {/* Password Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('auth.password_placeholder')}
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
                  {t('label.confirm_password')}
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
                  t('btn.create_account')
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('auth.already_account')}{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {t('auth.sign_in_here')}
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
