# Admin Access Guide

## How to Access Admin Dashboard

### 1. Login as Admin
- Go to the login page
- Use the admin demo account:
  - **Mobile Number**: `9876543000`
  - **Password**: Any password (demo mode)

### 2. Admin Registration
- Admin registration is not available through the public registration page
- Admins can only be created through:
  - Using the demo admin account (mobile: 9876543000)
  - Direct database access (for production deployments)
  - Backend API (when implemented)

### 3. Admin Dashboard Features

#### Overview Tab
- View total statistics (workers, customers, bookings, revenue)
- See recent activity and pending verifications

#### Workers Tab
- View all registered workers
- Verify/reject worker accounts
- See worker details and skills

#### Bookings Tab
- View all bookings with their status
- Track booking progress

#### Verification Tab
- **Main Admin Function**: Verify pending bookings
- View customer details (name, phone, gender, location)
- Call verification system:
  - Mark customer as verified
  - Mark worker as verified
  - Add call notes
  - Add admin notes
- Assign appropriate worker to verified bookings
- Reject bookings if needed

### 4. Admin Workflow

1. **Customer creates booking** → Status: `pending_admin`
2. **Admin receives notification** in Verification tab
3. **Admin calls customer** to verify details
4. **Admin calls worker** to verify availability
5. **Admin marks verification** with call notes
6. **Admin assigns worker** from available verified workers
7. **Booking status** changes to `worker_assigned`
8. **Worker receives assignment** and can accept/reject

### 5. Admin Controls

- **Verify Workers**: Approve/reject worker registrations
- **Call Verification**: Phone verification system
- **Worker Assignment**: Assign best worker for each job
- **Booking Management**: Track all bookings
- **Revenue Tracking**: Monitor platform earnings

### 6. Safety Features

- **Gender-based matching**: Respects women-only preferences
- **Location verification**: Ensures proximity matching
- **Call verification**: Phone verification for safety
- **Worker verification**: Background check system

## Demo Data Available

- **Admin**: 9876543000
- **Customer**: 9876543201 (Amit Shah)
- **Worker**: 9876543210 (Priya Sharma)

All demo accounts accept any password for testing.

### Additional Demo Accounts

**Workers:**
- Rajesh Kumar (Electrician): 9876543211
- Sunita Devi (Cook): 9876543212
- Vikram Singh (Plumber): 9876543213
- Meera Patel (Gardener): 9876543214
- Amit Verma (Carpenter): 9876543215
- Lakshmi Reddy (House Cleaner): 9876543216
- Ravi Shankar (Painter): 9876543217
- Anita Joshi (Cook): 9876543218
- Suresh Yadav (Farmer): 9876543219

**Customers:**
- Kavita Desai: 9876543202
