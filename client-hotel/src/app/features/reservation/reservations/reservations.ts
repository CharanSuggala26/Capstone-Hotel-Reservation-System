import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ReservationService } from '../../../services/reservation';
import { AuthService } from '../../../services/auth';
import { ReservationDto, ReservationStatus } from '../../../models';

@Component({
  selector: 'app-reservations',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatCardModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css'
})
export class ReservationsComponent implements OnInit {
  displayedColumns: string[] = ['hotelName', 'roomNumber', 'checkInDate', 'checkOutDate', 'numberOfGuests', 'totalAmount', 'status', 'actions'];
  dataSource = new MatTableDataSource<ReservationDto>();
  loading = false;
  ReservationStatus = ReservationStatus;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.hasRole('Admin') || this.hasRole('HotelManager') || this.hasRole('Receptionist')) {
      this.displayedColumns = ['hotelName', 'userName', 'roomNumber', 'checkInDate', 'checkOutDate', 'numberOfGuests', 'totalAmount', 'status', 'actions'];
    }
    this.loadReservations();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadReservations(): void {
    // Avoid NG0100 by deferring the loading state change
    setTimeout(() => {
      this.loading = true;
      let obs;

      // Attempt to load all reservations if user is staff
      // Note: Backend requires Admin role for /all endpoint, so this assumes Managers/Receptionists have that access or backend will change
      if (this.hasRole('Admin') || this.hasRole('HotelManager') || this.hasRole('Receptionist')) {
        obs = this.reservationService.getAllReservations();
      } else {
        obs = this.reservationService.getReservations();
      }

      obs.subscribe({
        next: (response: any) => {
          // Handle if backend returns array directly
          if (Array.isArray(response)) {
            this.dataSource.data = response;
          }
          // Handle if backend returns ApiResponse format
          else if (response && response.success && response.data) {
            this.dataSource.data = response.data;
          }
          else {
            this.dataSource.data = [];
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.cdr.detectChanges();
          console.error('Error loading reservations:', error);
          // Fallback for 403 or other errors? For now just log.
          if (error.status === 403 && (this.hasRole('HotelManager') || this.hasRole('Receptionist'))) {
            this.snackBar.open('Access denied to all reservations (requires Admin)', 'Close', { duration: 5000 });
          }
        }
      });
    });
  }

  getStatusText(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.Booked: return 'Booked';
      case ReservationStatus.Confirmed: return 'Confirmed';
      case ReservationStatus.CheckedIn: return 'Checked In';
      case ReservationStatus.CheckedOut: return 'Checked Out';
      case ReservationStatus.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  getStatusColor(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.Booked: return 'accent';
      case ReservationStatus.Confirmed: return 'primary';
      case ReservationStatus.CheckedIn: return 'primary';
      case ReservationStatus.CheckedOut: return '';
      case ReservationStatus.Cancelled: return 'warn';
      default: return '';
    }
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  confirmReservation(reservationId: number): void {
    this.reservationService.confirmReservation(reservationId).subscribe({
      next: () => {
        this.snackBar.open('Reservation confirmed', 'Close', { duration: 3000 });
        this.loadReservations();
      },
      error: (error) => {
        console.error('Confirmation failed:', error);
        this.snackBar.open('Confirmation failed', 'Close', { duration: 3000 });
      }
    });
  }

  cancelReservation(reservationId: number): void {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    this.reservationService.cancelReservation(reservationId).subscribe({
      next: () => {
        this.snackBar.open('Reservation cancelled', 'Close', { duration: 3000 });
        this.loadReservations();
      },
      error: (error) => {
        console.error('Cancellation failed:', error);
        this.snackBar.open('Cancellation failed', 'Close', { duration: 3000 });
      }
    });
  }

  checkIn(reservationId: number): void {
    this.reservationService.checkIn(reservationId).subscribe({
      next: () => {
        this.snackBar.open('Checked in successfully', 'Close', { duration: 3000 });
        this.loadReservations();
      },
      error: (error) => {
        console.error('Check-in failed:', error);
        this.snackBar.open('Check-in failed', 'Close', { duration: 3000 });
      }
    });
  }

  checkOut(reservationId: number): void {
    this.reservationService.checkOut(reservationId).subscribe({
      next: () => {
        this.snackBar.open('Checked out successfully', 'Close', { duration: 3000 });
        this.loadReservations();
      },
      error: (error) => {
        console.error('Check-out failed:', error);
        this.snackBar.open('Check-out failed', 'Close', { duration: 3000 });
      }
    });
  }

  generateBill(reservation: ReservationDto): void {
    // Calculate charges
    const roomCharges = reservation.totalAmount;
    const taxAmount = roomCharges * 0.1; // 10% tax assumption
    const totalAmount = roomCharges + taxAmount;
    const billData = {
      reservationId: reservation.id,
      roomCharges: roomCharges,
      additionalCharges: 0,
      taxAmount: taxAmount
    };

    this.reservationService.createBill(billData).subscribe({
      next: (response: any) => {
        // Should check response for success or returned bill data
        const bill = response.data || (response.id ? response : null);
        const msg = bill ? 'Bill ready' : 'Bill generated';

        this.snackBar.open(msg, 'View Bill', { duration: 5000 }).onAction().subscribe(() => {
          this.router.navigate(['/dashboard/bills']);
        });
        // If already on the page or need refresh
        this.loadReservations();
      },
      error: (error) => {
        console.error('Bill generation failed:', error);
        // If error is 400/500 but related to duplicate (handled by backend now, but safety net)
        this.snackBar.open('Could not open bill. Please check Bills page.', 'Close', { duration: 3000 });
      }
    });
  }

  canConfirm(reservation: ReservationDto): boolean {
    return (this.hasRole('HotelManager') || this.hasRole('Admin')) &&
      reservation.status === ReservationStatus.Booked;
  }

  canCancel(reservation: ReservationDto): boolean {
    const status = reservation.status;
    const isBookedOrConfirmed = status === ReservationStatus.Booked || status === ReservationStatus.Confirmed;

    if (this.hasRole('HotelManager') || this.hasRole('Admin')) {
      return isBookedOrConfirmed;
    }
    if (this.hasRole('Guest')) {
      return isBookedOrConfirmed;
    }
    return false;
  }

  canCheckIn(reservation: ReservationDto): boolean {
    return this.hasRole('Receptionist') && reservation.status === ReservationStatus.Confirmed;
  }

  canCheckOut(reservation: ReservationDto): boolean {
    return this.hasRole('Receptionist') && reservation.status === ReservationStatus.CheckedIn;
  }

  canGenerateBill(reservation: ReservationDto): boolean {
    return (this.hasRole('Admin') || this.hasRole('Receptionist')) && reservation.status === ReservationStatus.CheckedOut;
  }
}
