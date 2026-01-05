export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  roles: string[];
  hotelId?: number;
}

export interface HotelDto {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  createdAt: Date;
  totalRooms: number;
}

export interface RoomDto {
  id: number;
  roomNumber: string;
  type: RoomType;
  basePrice: number;
  capacity: number;
  status: RoomStatus;
  hotelId: number;
  hotelName: string;
}

export interface ReservationDto {
  id: number;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalAmount: number;
  status: ReservationStatus;
  createdAt: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  userId: string;
  userName: string;
  roomId: number;
  roomNumber: string;
  hotelName: string;
  hotelId: number;
}

export interface BillDto {
  id: number;
  roomCharges: number;
  additionalCharges: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  paidAt?: Date;
  reservationId: number;
  userName: string;
  roomNumber: string;
}

export interface NotificationDto {
  id: number;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  reservationId?: number;
}

export enum RoomType {
  Single = 1,
  Double = 2,
  Suite = 3,
  Deluxe = 4
}

export enum RoomStatus {
  Available = 1,
  Occupied = 2,
  Maintenance = 3
}

export enum ReservationStatus {
  Booked = 1,
  Confirmed = 2,
  CheckedIn = 3,
  CheckedOut = 4,
  Cancelled = 5
}

export enum PaymentStatus {
  Pending = 1,
  Paid = 2,
  Refunded = 3
}

export enum NotificationType {
  BookingConfirmation = 0,
  CheckInReminder = 1,
  CheckOutReminder = 2,
  CheckInSuccess = 3,
  CheckOutSuccess = 4,
  BookingCancelled = 5
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuthResponseDto {
  success: boolean;
  message: string;
  token: string;
  expires: Date;
  user: UserDto;
}

export interface LoginRequest {
  email: string;
  password: string;
  request: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface UserDetailsDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  createdAt: Date;
  roles: string[];
  totalReservations?: number;
}

export interface AssignHotelDto {
  userId: string;
  hotelId: number;
}
