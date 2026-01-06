# Hotel Management System - Angular Frontend

A modern Angular application for hotel reservation management with role-based access control.

## Features

### Core Functionality
- **Authentication & Authorization**: JWT-based login/register with role-based access
- **Hotel Management**: Browse and manage hotels
- **Room Booking**: Search available rooms and make reservations
- **Reservation Management**: View and manage bookings
- **Billing System**: View bills and process payments
- **Role-Based Dashboard**: Different interfaces for Guest, Receptionist, HotelManager, and Admin
- **Reccomendation System**: Reccomends Hotels based on previous Reservations

### User Roles
- **Guest**: Browse hotels, book rooms, manage reservations, pay bills
- **Receptionist**: Check-in/out guests, view guest information
- **HotelManager**: Manage hotels, rooms, and view reports
- **Admin**: Full system access, user management, role assignment

## Technology Stack

- **Angular 21** - Latest version with standalone components
- **TypeScript** - Type-safe development
- **Reactive Forms** - Form handling and validation
- **HTTP Client** - API communication with interceptors
- **JWT Authentication** - Secure token-based authentication
- **CSS** - Custom styling (no SCSS as requested)


## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Angular CLI (v21 or higher)
- Backend API running on https://localhost:7018

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd client-hotel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   ng serve
   ```

4. **Access the application**
   - Open browser to `http://localhost:4200`
   - The app will automatically reload on file changes


## Testing Credentials

Use these test accounts with your backend:

```typescript
// Admin Account
{
  email: "admin@hotel.com",
  password: "Admin@123"
}

// Guest Account
{
  email: "suggalasaicharan789@gmail.com", 
  password: "Saicharan@18"
}
// Hotel Manager Account
{
 email: "anilmanager@hotel.com",
password: "Anil@18"
}
// Receptionist Account
{
  email: "receptionist@hotel.com"
  password: "Kishore@18
}
```

## Project Structure

```
src/
├── app/
│   ├── components/          # Feature components
│   │   ├── login/          # Authentication
│   │   ├── register/       # User registration
│   │   ├── dashboard/      # Main dashboard
│   │   ├── hotels/         # Hotel listing
│   │   ├── room-booking/   # Room booking
│   │   ├── reservations/   # Reservation management
│   │   ├── bills/          # Billing system
│   │   └── unauthorized/   # Access denied page
│   ├── services/           # Business logic services
│   │   ├── auth.ts         # Authentication service
│   │   ├── hotel.ts        # Hotel management
│   │   └── reservation.ts  # Reservation & billing
│   ├── guards/             # Route protection
│   │   └── auth-guard.ts   # Auth & role guards
│   ├── interceptors/       # HTTP interceptors
│   │   └── auth.interceptor.ts # JWT token injection
│   ├── models/             # TypeScript interfaces
│   │   └── index.ts        # API models & enums
│   └── app.routes.ts       # Application routing
```


## API Configuration

The application is configured to connect to the backend API at:
- **Base URL**: `https://localhost:7018`
- **Authentication**: JWT tokens stored in localStorage
- **Interceptor**: Automatically adds Bearer token to requests



## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Route Guards**: Protect routes based on authentication and roles
- **HTTP Interceptor**: Automatic token injection
- **Platform Checks**: SSR-safe localStorage access
- **Role-Based Access**: Different UI based on user roles

## Component Architecture

### Key Components
#### DashboardComponent
- Role-based navigation menu
- User information display
- Child route outlet
- Logout functionality

#### HotelsComponent
- Hotel listing with cards
- Role-based action buttons
- Navigation to booking

#### RoomBookingComponent
- Date-based room search
- Available room display
- Booking form with validation
- Reservation creation

#### ReservationsComponent
- User reservation listing
- Status display with color coding
- Check-in/out actions (for staff)

#### BillsComponent
- Bill listing with details
- Payment processing
- Status tracking

## Development Guidelines

### Code Style
- Used TypeScript interfaces for type safety
- Implemented reactive forms for user input
- Followed Angular style guide conventions
- Use CSS  for styling
- Implemented proper error handling


## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend API allows requests from `http://localhost:4200`
2. **Token Expiry**: Check JWT token expiration and refresh logic
3. **Route Access**: Verify user roles match required permissions
4. **API Connection**: Confirm backend is running on `https://localhost:7018`


## Support

For issues or questions:
1. Check the console for error messages
2. Verify API connectivity
3. Ensure proper user roles and permissions
