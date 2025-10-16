# LabourLink - Worker-Customer Connection Platform

A modern, user-friendly platform connecting skilled workers with customers in Chittoor district, Andhra Pradesh. Built with React, Node.js, Express, and MongoDB.

## 🌟 Features

### For Customers
- **Browse Workers**: Find skilled workers by profession, location, and rating
- **Real-time Booking**: Book workers directly with instant confirmation
- **Live Location Sharing**: Share location with workers for better coordination
- **Help & Complaint System**: Contact admin for any issues or complaints
- **Modern UI**: Beautiful, responsive interface with smooth animations
- **Multi-language Support**: Available in multiple languages

### For Workers
- **Profile Management**: Create detailed profiles with skills and experience
- **Booking Management**: Accept, reject, and manage customer bookings
- **Location Services**: Share location with customers
- **Rating System**: Build reputation through customer reviews
- **Verification System**: Get verified by admin for better visibility

### For Admins
- **Dashboard**: Comprehensive overview of platform statistics
- **User Management**: Manage workers, customers, and bookings
- **Verification System**: Verify workers and approve bookings
- **Complaint Management**: Handle customer complaints and issues
- **Location Data**: Manage Chittoor district and mandals data

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Framer Motion** for animations
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Multer** for file uploads
- **Express Validator** for validation

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd labourlink
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../src
npm install
```

### 3. Environment Setup

#### Backend Environment
Create `backend/.env` file:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/labourlink
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

### 4. Database Setup

#### Start MongoDB
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

#### Initialize Database
```bash
cd backend
node scripts/initialize-db.js
```

This will create:
- Sample categories and professions
- Chittoor district and all mandals
- Admin user (admin@labourlink.com / admin123)
- Sample worker (worker@labourlink.com / worker123)
- Sample customer (customer@labourlink.com / customer123)

### 5. Start the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```

#### Start Frontend Development Server
```bash
cd src
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 Usage

### Customer Workflow
1. **Register/Login** as a customer
2. **Browse Workers** by profession, location, or rating
3. **Book a Worker** by selecting date, time, and describing the job
4. **Share Location** for better coordination
5. **Contact Worker** directly after admin verification
6. **Rate & Review** after job completion
7. **Use Help Button** to contact admin for any issues

### Worker Workflow
1. **Register/Login** as a worker
2. **Complete Profile** with skills, experience, and rates
3. **Get Verified** by admin
4. **Receive Bookings** from customers
5. **Accept/Reject** bookings
6. **Share Location** with customers
7. **Complete Jobs** and receive ratings

### Admin Workflow
1. **Login** as admin
2. **Verify Workers** and approve profiles
3. **Manage Bookings** and assign workers
4. **Handle Complaints** from customers
5. **Monitor Platform** statistics and activity

## 🗺️ Chittoor District Coverage

The platform covers all major mandals in Chittoor district:

### Major Mandals
- **Chittoor** - District headquarters
- **Tirupati** - Major pilgrimage center
- **Chandragiri** - Historical town
- **Puttur** - Agricultural hub
- **Palamaner** - Industrial area
- **Kuppam** - Border town
- **Srikalahasti** - Temple town
- **Madanapalle** - Educational center

### Complete Coverage
The platform includes data for 50+ mandals with:
- GPS coordinates
- Population data
- Area information
- Local landmarks

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/location` - Update location
- `PUT /api/users/password` - Change password

### Workers
- `GET /api/workers` - Get all workers
- `GET /api/workers/:id` - Get worker by ID
- `PUT /api/workers/profile` - Update worker profile
- `GET /api/workers/:id/bookings` - Get worker bookings

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Complaints
- `POST /api/complaints` - Submit complaint
- `GET /api/complaints` - Get user complaints
- `GET /api/complaints/:id` - Get complaint details
- `PUT /api/complaints/:id/status` - Update complaint status

### Locations
- `GET /api/locations/districts` - Get all districts
- `GET /api/locations/mandals` - Get mandals by district
- `GET /api/locations/chittor-mandals` - Get Chittoor mandals
- `GET /api/locations/search` - Search locations

## 🎨 UI Features

### Modern Design
- **Gradient Backgrounds** - Beautiful color schemes
- **Glass Morphism** - Frosted glass effects
- **Smooth Animations** - Framer Motion animations
- **Responsive Design** - Works on all devices
- **Dark/Light Mode** - Theme switching (coming soon)

### User Experience
- **Intuitive Navigation** - Easy-to-use interface
- **Real-time Updates** - Live data synchronization
- **Help System** - Integrated help and complaint system
- **Location Services** - GPS integration
- **Multi-language** - Internationalization support

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt encryption
- **Input Validation** - Server-side validation
- **Rate Limiting** - API protection
- **CORS Protection** - Cross-origin security
- **Helmet.js** - Security headers

## 📊 Database Schema

### Collections
- **Users** - User accounts and profiles
- **Workers** - Worker-specific data
- **Customers** - Customer-specific data
- **Bookings** - Job bookings and status
- **Reviews** - Worker ratings and reviews
- **Complaints** - Customer complaints
- **Notifications** - System notifications
- **Districts** - Location data
- **Mandals** - Sub-district data

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to Heroku, Vercel, or AWS
4. Set up SSL certificates

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Netlify, Vercel, or AWS S3
3. Configure environment variables
4. Set up custom domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Email: support@labourlink.com
- Use the in-app help system
- Create an issue on GitHub

## 🔮 Future Features

- **Mobile App** - React Native version
- **Payment Integration** - Online payment support
- **Video Calls** - In-app video calling
- **AI Matching** - Smart worker-customer matching
- **Analytics Dashboard** - Advanced analytics
- **Multi-language** - More language support
- **Push Notifications** - Real-time notifications

---

**LabourLink** - Connecting skilled workers with customers in Chittoor district! 🚀