import { Worker, Customer, Booking, District, Profession, Category, User } from '../types';

export const districts: District[] = [
  { id: '1', name: 'Chittoor', state: 'Andhra Pradesh' },
];

// Revenue Divisions with Mandals (Sub-districts)
export interface Mandal {
  id: string;
  name: string;
}

export interface RevenueDivision {
  id: string;
  name: string;
  mandals: Mandal[];
}

export const revenueDivisions: RevenueDivision[] = [
  {
    id: 'chittoor_division',
    name: 'Chittoor Revenue Division',
    mandals: [
      { id: 'chittoor', name: 'Chittoor' },
      { id: 'gudipala', name: 'Gudipala' },
      { id: 'yadamari', name: 'Yadamari' },
      { id: 'gangadhara_nellore', name: 'Gangadhara Nellore' },
      { id: 'puthalapattu', name: 'Puthalapattu' },
      { id: 'penumuru', name: 'Penumuru' },
      { id: 'thavanampalle', name: 'Thavanampalle' },
      { id: 'srirangarajapuram', name: 'Srirangarajapuram' },
      { id: 'vedurukuppam', name: 'Vedurukuppam' },
      { id: 'irala', name: 'Irala' },
      { id: 'pothalpattu', name: 'Pothalpattu' },
    ]
  },
  {
    id: 'nagari_division',
    name: 'Nagari Revenue Division',
    mandals: [
      { id: 'nagari', name: 'Nagari' },
      { id: 'karvetinagar', name: 'Karvetinagar' },
      { id: 'nindra', name: 'Nindra' },
      { id: 'palasamudram', name: 'Palasamudram' },
      { id: 'vijayapuram', name: 'Vijayapuram' },
    ]
  },
  {
    id: 'palamaneru_division',
    name: 'Palamaneru Revenue Division',
    mandals: [
      { id: 'palamaneru', name: 'Palamaneru' },
      { id: 'rompicherla', name: 'Rompicherla' },
      { id: 'pulicherla', name: 'Pulicherla' },
      { id: 'gangavaram', name: 'Gangavaram' },
      { id: 'pedapanjani', name: 'Pedapanjani' },
      { id: 'somala', name: 'Somala' },
      { id: 'chowdepalle', name: 'Chowdepalle' },
      { id: 'bangarupalem', name: 'Bangarupalem' },
      { id: 'byreddipalle', name: 'Byreddipalle' },
      { id: 'venkatagirikota', name: 'Venkatagirikota' },
    ]
  },
  {
    id: 'kuppam_division',
    name: 'Kuppam Revenue Division',
    mandals: [
      { id: 'kuppam', name: 'Kuppam' },
      { id: 'santhipuram', name: 'Santhipuram' },
      { id: 'ramakuppam', name: 'Ramakuppam' },
      { id: 'gudupalle', name: 'Gudupalle' },
    ]
  }
];

// Flat list of all mandals for easy access
export const mandals: Mandal[] = revenueDivisions.flatMap(division => division.mandals);

export const categories: Category[] = [
  { id: '1', name: 'House Cleaning', description: 'Home cleaning and maintenance', icon: '🏠' },
  { id: '2', name: 'Electrical Work', description: 'Electrical repairs and installations', icon: '⚡' },
  { id: '3', name: 'Plumbing', description: 'Plumbing repairs and installations', icon: '🔧' },
  { id: '4', name: 'Agriculture', description: 'Farming and agricultural work', icon: '🌾' },
  { id: '5', name: 'Carpentry', description: 'Woodwork and furniture repair', icon: '🔨' },
  { id: '6', name: 'Painting', description: 'House painting and decoration', icon: '🎨' },
  { id: '7', name: 'Gardening', description: 'Garden maintenance and landscaping', icon: '🌱' },
  { id: '8', name: 'Cooking', description: 'Home cooking and meal preparation', icon: '👨‍🍳' },
];

// Skills organized by category
export const skillsByCategory: Record<string, string[]> = {
  '1': [ // House Cleaning
    'Deep Cleaning', 'Window Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning',
    'Floor Mopping', 'Dusting', 'Vacuuming', 'Carpet Cleaning'
  ],
  '2': [ // Electrical Work
    'Wiring', 'Switch Repair', 'Fan Installation', 'Light Fixture Installation',
    'Electrical Troubleshooting', 'Circuit Breaker Repair', 'Outlet Installation', 'Electrical Safety'
  ],
  '3': [ // Plumbing
    'Pipe Repair', 'Tap Installation', 'Drain Cleaning', 'Toilet Repair',
    'Water Heater Installation', 'Leak Detection', 'Pipe Replacement', 'Fixture Installation'
  ],
  '4': [ // Agriculture
    'Crop Planting', 'Soil Preparation', 'Irrigation', 'Harvesting',
    'Pest Control', 'Fertilizer Application', 'Farm Equipment Operation', 'Crop Monitoring'
  ],
  '5': [ // Carpentry
    'Furniture Repair', 'Wood Cutting', 'Joining', 'Sanding',
    'Wood Finishing', 'Cabinet Making', 'Door Installation', 'Window Frame Repair'
  ],
  '6': [ // Painting
    'Wall Painting', 'Exterior Painting', 'Color Matching', 'Surface Preparation',
    'Primer Application', 'Brush Techniques', 'Roller Techniques', 'Paint Mixing'
  ],
  '7': [ // Gardening
    'Plant Care', 'Landscaping', 'Garden Design', 'Pruning',
    'Soil Management', 'Planting', 'Garden Maintenance', 'Seasonal Care'
  ],
  '8': [ // Cooking
    'North Indian Cuisine', 'South Indian Cuisine', 'Baking', 'Meal Planning',
    'Food Safety', 'Nutrition Planning', 'Catering', 'Special Diets'
  ],
};

export const professions: Profession[] = [
  { id: '1', name: 'House Cleaner', category: '1', description: 'Professional house cleaning services' },
  { id: '2', name: 'Electrician', category: '2', description: 'Electrical repair and installation' },
  { id: '3', name: 'Plumber', category: '3', description: 'Plumbing repair and installation' },
  { id: '4', name: 'Farmer', category: '4', description: 'Agricultural and farming work' },
  { id: '5', name: 'Carpenter', category: '5', description: 'Woodwork and furniture repair' },
  { id: '6', name: 'Painter', category: '6', description: 'House painting and decoration' },
  { id: '7', name: 'Gardener', category: '7', description: 'Garden maintenance and landscaping' },
  { id: '8', name: 'Cook', category: '8', description: 'Home cooking and meal preparation' },
];

export const mockWorkers: Worker[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    username: 'priya',
    email: 'priya@example.com',
    phone: '9876543210',
    district: '1',
    gender: 'female',
    currentLocation: {
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'Mumbai Central, Maharashtra',
      lastUpdated: new Date()
    },
    type: 'worker',
    profession: 'House Cleaner',
    category: '1',
    skills: ['Deep Cleaning', 'Window Cleaning', 'Kitchen Cleaning'],
    experience: 3,
    hourlyRate: 200,
    availability: 'available',
    rating: 4.8,
    totalJobs: 45,
    bio: 'Professional house cleaner with 3 years experience. Specialized in deep cleaning and maintenance.',
    isVerified: true,
    createdAt: new Date('2023-01-15'),
    approvalStatus: 'approved',
    panchayatApprovalDate: new Date('2023-01-16'),
    appliedDate: new Date('2023-01-15'),
  },
  {
    id: '2',
    name: 'Rajesh Kumar',
    username: 'rajesh',
    email: 'rajesh@example.com',
    phone: '9876543211',
    district: '1',
    gender: 'male',
    currentLocation: {
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'Mumbai Central, Maharashtra',
      lastUpdated: new Date()
    },
    type: 'worker',
    profession: 'Electrician',
    category: '2',
    skills: ['Wiring', 'Switch Repair', 'Fan Installation'],
    experience: 5,
    hourlyRate: 300,
    availability: 'available',
    rating: 4.9,
    totalJobs: 78,
    bio: 'Licensed electrician with 5 years experience. Expert in residential electrical work.',
    isVerified: true,
    createdAt: new Date('2022-11-20'),
    approvalStatus: 'approved',
    panchayatApprovalDate: new Date('2022-11-21'),
    appliedDate: new Date('2022-11-20'),
  },
  {
    id: '3',
    name: 'Sunita Devi',
    username: 'sunita',
    email: 'sunita@example.com',
    phone: '9876543212',
    district: '1',
    gender: 'female',
    type: 'worker',
    profession: 'Cook',
    category: '8',
    skills: ['North Indian Cuisine', 'South Indian Cuisine', 'Baking'],
    experience: 4,
    hourlyRate: 250,
    availability: 'available',
    rating: 4.7,
    totalJobs: 32,
    bio: 'Experienced cook specializing in traditional Indian cuisine. Can prepare meals for families.',
    isVerified: true,
    createdAt: new Date('2023-03-10'),
    approvalStatus: 'approved',
    panchayatApprovalDate: new Date('2023-03-11'),
    appliedDate: new Date('2023-03-10'),
  },
  {
    id: '4',
    name: 'Vikram Singh',
    username: 'vikram',
    email: 'vikram@example.com',
    phone: '9876543213',
    district: '1',
    type: 'worker', gender: 'male',
    profession: 'Plumber',
    category: '3',
    skills: ['Pipe Repair', 'Tap Installation', 'Drain Cleaning'],
    experience: 6,
    hourlyRate: 350,
    availability: 'busy',
    rating: 4.6,
    totalJobs: 92,
    bio: 'Professional plumber with 6 years experience. Expert in all types of plumbing repairs.',
    isVerified: true,
    createdAt: new Date('2022-08-15'),
    approvalStatus: 'approved',
    panchayatApprovalDate: new Date('2022-08-16'),
    appliedDate: new Date('2022-08-15'),
  },
  {
    id: '5',
    name: 'Meera Patel',
    username: 'meera',
    email: 'meera@example.com',
    phone: '9876543214',
    district: '1',
    type: 'worker',
    gender: 'female',
    profession: 'Gardener',
    category: '7',
    skills: ['Plant Care', 'Landscaping', 'Garden Design'],
    experience: 2,
    hourlyRate: 180,
    availability: 'available',
    rating: 4.5,
    totalJobs: 28,
    bio: 'Passionate gardener with expertise in plant care and garden maintenance.',
    isVerified: true,
    createdAt: new Date('2023-06-01'),
    approvalStatus: 'approved',
    panchayatApprovalDate: new Date('2023-06-02'),
    appliedDate: new Date('2023-06-01'),
  },
  {
    id: '6',
    name: 'Amit Verma',
    username: 'amit_carpenter',
    email: 'amitv@example.com',
    phone: '9876543215',
    district: '1',
    gender: 'male',
    currentLocation: {
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'Mumbai Central, Maharashtra',
      lastUpdated: new Date()
    },
    type: 'worker',
    profession: 'Carpenter',
    category: '5',
    skills: ['Furniture Repair', 'Wood Cutting', 'Cabinet Making', 'Door Installation'],
    experience: 7,
    hourlyRate: 320,
    availability: 'available',
    rating: 4.7,
    totalJobs: 56,
    bio: 'Skilled carpenter specializing in furniture repair and custom woodwork. 7 years of professional experience.',
    isVerified: true,
    createdAt: new Date('2022-09-10'),
    approvalStatus: 'approved',
    panchayatApprovalDate: new Date('2022-09-11'),
    appliedDate: new Date('2022-09-10'),
  },
  {
    id: '7',
    name: 'Lakshmi Reddy',
    username: 'lakshmi',
    email: 'lakshmi@example.com',
    phone: '9876543216',
    district: '1',
    gender: 'female',
    currentLocation: {
      latitude: 19.1136,
      longitude: 72.8697,
      address: 'Andheri West, Maharashtra',
      lastUpdated: new Date()
    },
    type: 'worker',
    profession: 'House Cleaner',
    category: '1',
    skills: ['Deep Cleaning', 'Floor Mopping', 'Dusting', 'Kitchen Cleaning'],
    experience: 4,
    hourlyRate: 220,
    availability: 'available',
    rating: 4.9,
    totalJobs: 67,
    bio: 'Professional house cleaner with focus on quality and attention to detail. Experienced in all types of cleaning.',
    isVerified: true,
    createdAt: new Date('2022-12-05'),
    approvalStatus: 'approved',
    panchayatApprovalDate: new Date('2022-12-06'),
    appliedDate: new Date('2022-12-05'),
  },
  {
    id: '8',
    name: 'Ravi Shankar',
    username: 'ravi_painter',
    email: 'ravi@example.com',
    phone: '9876543217',
    district: '1',
    gender: 'male',
    currentLocation: {
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'Mumbai Central, Maharashtra',
      lastUpdated: new Date()
    },
    type: 'worker',
    profession: 'Painter',
    category: '6',
    skills: ['Wall Painting', 'Exterior Painting', 'Color Matching', 'Surface Preparation'],
    experience: 6,
    hourlyRate: 280,
    availability: 'available',
    rating: 4.6,
    totalJobs: 41,
    bio: 'Experienced painter offering interior and exterior painting services. Quality work guaranteed.',
    isVerified: true,
    createdAt: new Date('2023-02-14'),
    approvalStatus: 'approved',
    panchayatApprovalDate: new Date('2023-02-15'),
    appliedDate: new Date('2023-02-14'),
  },
  {
    id: '9',
    name: 'Anita Joshi',
    username: 'anita_cook',
    email: 'anita@example.com',
    phone: '9876543218',
    district: '1',
    gender: 'female',
    currentLocation: {
      latitude: 19.1136,
      longitude: 72.8697,
      address: 'Andheri West, Maharashtra',
      lastUpdated: new Date()
    },
    type: 'worker',
    profession: 'Cook',
    category: '8',
    skills: ['South Indian Cuisine', 'Baking', 'Meal Planning', 'Special Diets'],
    experience: 5,
    hourlyRate: 260,
    availability: 'available',
    rating: 4.8,
    totalJobs: 53,
    bio: 'Expert cook specializing in South Indian cuisine and healthy meal preparation.',
    isVerified: true,
    createdAt: new Date('2022-10-20'),
    approvalStatus: 'approved',
    panchayatApprovalDate: new Date('2022-10-21'),
    appliedDate: new Date('2022-10-20'),
  },
  {
    id: '10',
    name: 'Suresh Yadav',
    username: 'suresh_farmer',
    email: 'suresh@example.com',
    phone: '9876543219',
    district: '1',
    gender: 'male',
    type: 'worker',
    profession: 'Farmer',
    category: '4',
    skills: ['Crop Planting', 'Irrigation', 'Harvesting', 'Pest Control'],
    experience: 10,
    hourlyRate: 200,
    availability: 'available',
    rating: 4.7,
    totalJobs: 35,
    bio: 'Experienced farmer with 10 years in agriculture. Expert in crop management and irrigation systems.',
    isVerified: true,
    createdAt: new Date('2023-04-08'),
    approvalStatus: 'approved',
    panchayatApprovalDate: new Date('2023-04-09'),
    appliedDate: new Date('2023-04-08'),
  },
];

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Amit Shah',
    username: 'amit',
    email: 'amit@example.com',
    phone: '9876543201',
    district: '1',
    gender: 'male',
    currentLocation: {
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'Mumbai Central, Maharashtra',
      lastUpdated: new Date()
    },
    type: 'customer',
    preferences: {
      maxDistance: 10,
    },
    createdAt: new Date('2023-05-15'),
  },
  {
    id: '2',
    name: 'Kavita Desai',
    username: 'kavita',
    email: 'kavita@example.com',
    phone: '9876543202',
    district: '1',
    gender: 'female',
    currentLocation: {
      latitude: 19.1136,
      longitude: 72.8697,
      address: 'Andheri West, Maharashtra',
      lastUpdated: new Date()
    },
    type: 'customer',
    preferences: {
      maxDistance: 5,
    },
    createdAt: new Date('2023-07-20'),
  },
];

// Admin user for testing
export const mockAdmin: User = {
  id: 'admin-1',
  name: 'Admin User',
  username: 'admin',
  email: 'admin@labourlink.com',
  phone: '9876543000',
  district: '1',
  gender: 'male',
  currentLocation: {
    latitude: 19.0760,
    longitude: 72.8777,
    address: 'Mumbai Central, Maharashtra',
    lastUpdated: new Date()
  },
  type: 'admin',
  createdAt: new Date('2023-01-01'),
};

export const mockBookings: Booking[] = [
  {
    id: '1',
    customerId: '1',
    workerId: '1',
    task: 'Deep House Cleaning',
    description: 'Complete deep cleaning of 2BHK apartment including kitchen, bathrooms, and living areas.',
    scheduledDate: new Date('2024-01-15T10:00:00'),
    estimatedDuration: 4,
    status: 'pending_admin',
    paymentMethod: 'cash',
    totalAmount: 800,
    createdAt: new Date('2024-01-10T14:30:00'),
    updatedAt: new Date('2024-01-10T14:30:00'),
    location: {
      address: '123, ABC Building, Mumbai Central',
      district: 'Mumbai Central',
    },
  },
  {
    id: '2',
    customerId: '2',
    workerId: '3',
    task: 'Daily Cooking Service',
    description: 'Prepare lunch and dinner for family of 4. North Indian cuisine preferred.',
    scheduledDate: new Date('2024-01-16T09:00:00'),
    estimatedDuration: 3,
    status: 'accepted',
    paymentMethod: 'cash',
    totalAmount: 750,
    createdAt: new Date('2024-01-12T16:45:00'),
    updatedAt: new Date('2024-01-12T18:20:00'),
    location: {
      address: '456, XYZ Society, Andheri West',
      district: 'Andheri West',
    },
  },
];
