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

### Build for Production

```bash
# Build the application
ng build

# Build with production optimizations
ng build --configuration production
```

## API Configuration

The application is configured to connect to the backend API at:
- **Base URL**: `https://localhost:7018`
- **Authentication**: JWT tokens stored in localStorage
- **Interceptor**: Automatically adds Bearer token to requests

### API Endpoints Used
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/hotels` - Fetch hotels
- `GET /api/rooms/available` - Search available rooms
- `POST /api/reservations` - Create booking
- `GET /api/reservations` - User reservations
- `GET /api/bills` - User bills
- `POST /api/bills/{id}/payment` - Process payment

## Authentication Flow

1. **Login/Register**: Users authenticate via login or register forms
2. **Token Storage**: JWT token stored in localStorage (with platform check)
3. **Route Protection**: Auth guard protects dashboard routes
4. **Role-Based Access**: Role guard restricts access based on user roles
5. **Auto-Logout**: Token expiry automatically logs out users

## Component Architecture

### Standalone Components
All components use Angular's standalone component architecture:
- No NgModules required
- Direct imports in component decorators
- Lazy loading for optimal performance

### Key Components

#### LoginComponent
- Reactive form validation
- JWT token handling
- Error display
- Navigation to dashboard on success

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

## Routing Configuration

```typescript
// Main routes
/login              - Login page
/register           - Registration page
/dashboard          - Protected dashboard (requires auth)
  /hotels           - Hotel listing
  /hotels/:id/book  - Room booking
  /reservations     - User reservations
  /bills            - User bills
/unauthorized       - Access denied page
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Route Guards**: Protect routes based on authentication and roles
- **HTTP Interceptor**: Automatic token injection
- **Platform Checks**: SSR-safe localStorage access
- **Role-Based Access**: Different UI based on user roles

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
  email: "john@example.com", 
  password: "Password@123"
}
```

## Development Guidelines

### Code Style
- Use TypeScript interfaces for type safety
- Implement reactive forms for user input
- Follow Angular style guide conventions
- Use CSS (not SCSS) for styling
- Implement proper error handling

### Component Generation
```bash
# Generate new component
ng g c components/component-name

# Generate new service  
ng g s services/service-name

# Generate new guard
ng g g guards/guard-name
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend API allows requests from `http://localhost:4200`
2. **Token Expiry**: Check JWT token expiration and refresh logic
3. **Route Access**: Verify user roles match required permissions
4. **API Connection**: Confirm backend is running on `https://localhost:7018`

### Debug Tips
- Check browser console for errors
- Verify network requests in DevTools
- Check localStorage for JWT token
- Validate API responses

## Future Enhancements

- Add more comprehensive error handling
- Implement real-time notifications
- Add advanced search and filtering
- Include reporting dashboards
- Add mobile responsiveness improvements
- Implement caching strategies

## Support

For issues or questions:
1. Check the console for error messages
2. Verify API connectivity
3. Ensure proper user roles and permissions
4. Review the component documentation above