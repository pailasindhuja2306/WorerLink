# LabourLink - Connect with Skilled Workers

A modern, user-friendly platform that connects customers with skilled workers for various services. Built with React, Node.js, Express, and MongoDB.

## 🌟 Features

### For Customers
- **Browse Workers**: Find skilled workers by profession, location, and rating
- **Easy Booking**: Simple booking process with instant confirmation
- **Real-time Location Sharing**: Share your location with workers for better coordination
- **Help & Support**: Built-in help system to contact admins for any issues
- **Reviews & Ratings**: Rate and review workers after service completion

### For Workers
- **Profile Management**: Create detailed profiles with skills and experience
- **Job Notifications**: Get notified about new bookings
- **Location Sharing**: Share your location with customers
- **Help System**: Contact admins for support and complaints

### For Admins
- **Dashboard**: Comprehensive admin dashboard with statistics
- **Worker Verification**: Verify and manage worker profiles
- **Booking Management**: Oversee all bookings and verifications
- **Help & Support Management**: Handle customer and worker complaints/help requests
- **Real-time Notifications**: Get notified about new help requests

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Context API** for state management

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **RESTful API** design
- **CORS** enabled for cross-origin requests

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd labourlink
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/labourlink
PORT=5000
NODE_ENV=development
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 5. Run the Application

#### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev
```

#### Option 2: Run Separately

**Start the Backend Server:**
```bash
npm run server
```

**Start the Frontend (in a new terminal):**
```bash
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🎯 Usage

### Getting Started

1. **Visit the Landing Page**: Open http://localhost:3000 to see the beautiful landing page
2. **Sign Up**: Click "Get Started" to create a new account
3. **Choose Your Role**: Register as a Customer, Worker, or Admin
4. **Start Using**: Access your dashboard based on your role

### User Roles

#### Customer
- Browse available workers
- Filter by profession, location, and rating
- Book workers for services
- Share location for better coordination
- Rate and review workers
- Contact admin for help

#### Worker
- Create detailed profile with skills
- Set hourly rates and availability
- Receive booking notifications
- Manage bookings and status
- Contact admin for support

#### Admin
- Verify worker profiles
- Manage all bookings
- Handle help requests and complaints
- View platform statistics
- Oversee the entire platform

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### Workers
- `GET /api/workers` - Get all workers
- `GET /api/workers/:id` - Get worker by ID
- `PUT /api/workers/:id` - Update worker
- `PATCH /api/workers/:id/verify` - Verify worker

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/user/:userId` - Get user's bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `PATCH /api/bookings/:id/verify` - Verify booking (admin)

### Help & Support
- `GET /api/help` - Get all help requests (admin)
- `GET /api/help/user/:userId` - Get user's help requests
- `POST /api/help` - Create help request
- `PATCH /api/help/:id/status` - Update help request status
- `PATCH /api/help/:id/assign` - Assign help request to admin

## 🎨 UI Features

### Modern Design
- **Gradient Backgrounds**: Beautiful gradient backgrounds throughout the app
- **Glassmorphism Effects**: Modern glass-like UI elements
- **Smooth Animations**: Hover effects and transitions
- **Responsive Design**: Works on all device sizes
- **Custom Scrollbars**: Styled scrollbars for better UX

### User Experience
- **Floating Help Button**: Always accessible help button
- **Real-time Updates**: Live data updates without page refresh
- **Loading States**: Beautiful loading animations
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Clear success notifications

## 🔒 Security Features

- **Input Validation**: All inputs are validated
- **CORS Protection**: Cross-origin request protection
- **MongoDB Injection Prevention**: Mongoose prevents NoSQL injection
- **Error Handling**: Comprehensive error handling

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- All screen sizes

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)
1. Build the frontend: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Set environment variables in your hosting service

### Backend Deployment (Heroku/Railway)
1. Set up MongoDB Atlas for production database
2. Update `MONGODB_URI` in environment variables
3. Deploy the `server` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. **Use the Help Button**: Click the floating help button in the app
2. **Check the Admin Dashboard**: Admins can view all help requests
3. **Create an Issue**: Open an issue on GitHub
4. **Contact Support**: Use the built-in help system

## 🎉 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **MongoDB** for the flexible database
- **Express.js** for the robust backend framework
- **Lucide** for the beautiful icons

---

**LabourLink** - Connecting skilled workers with customers who need them. Built with ❤️ for the community.