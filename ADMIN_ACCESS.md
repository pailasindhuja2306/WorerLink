# Admin Access Guide

## How to Access Admin Dashboard

### 1. Login as Admin
- Go to the login page
- Use the admin demo account:
  - **Email**: `admin@labourlink.com`
  - **Password**: Any password (demo mode)

### 2. Register as Admin
- Go to the registration page
- Select "Admin" as user type
- Fill in your details
- Complete registration to access admin dashboard

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

- **Admin**: admin@labourlink.com
- **Customer**: amit@example.com
- **Worker**: priya@example.com

All demo accounts accept any password for testing.
