import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HotelService } from '../../../services/hotel';
import { ReservationService } from '../../../services/reservation';
import { RoomDto, RoomType, ReservationDto, ReservationStatus, RoomStatus } from '../../../models';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-room-booking',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './room-booking.html',
  styleUrls: ['./room-booking.css']
})
export class RoomBookingComponent implements OnInit {
  bookingForm: FormGroup;
  availableRooms: RoomDto[] = [];
  hotelId!: number;
  loading = false;
  RoomType = RoomType;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private hotelService: HotelService,
    private reservationService: ReservationService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private auth: AuthService
  ) {
    this.bookingForm = this.fb.group({
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      numberOfGuests: [1, [Validators.required, Validators.min(1)]],
      selectedRoomId: ['', Validators.required],
      guestEmail: [''] 
    });

    this.guestForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['Guest123!', Validators.required],
      phoneNumber: ['']
    });
  }

  hasRole(role: string): boolean {
    return this.auth.hasRole(role);
  }

  get isStaff(): boolean {
    return this.hasRole('Admin') || this.hasRole('Receptionist') || this.hasRole('HotelManager');
  }

  ngOnInit(): void {
    this.hotelId = +this.route.snapshot.params['id'];
  }

  
  private formatDateToApiDate(value: any, isCheckIn: boolean): string {
    const d = value instanceof Date ? value : new Date(value);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hour = isCheckIn ? 14 : 11;
    return `${year}-${month}-${day}T${hour}:00:00Z`;
  }

  isSearchDisabled(): boolean {
    const ci = this.bookingForm.get('checkInDate')?.value;
    const co = this.bookingForm.get('checkOutDate')?.value;
    if (!ci || !co || !this.hotelId) return true;
    return new Date(co) <= new Date(ci);
  }

  searchRooms(): void {
    const rawCheckIn = this.bookingForm.get('checkInDate')?.value;
    const rawCheckOut = this.bookingForm.get('checkOutDate')?.value;
    if (!rawCheckIn || !rawCheckOut) {
      this.snackBar.open('Please select both check-in and check-out dates.', 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    const checkInStr = this.formatDateToApiDate(rawCheckIn, true);
    const checkOutStr = this.formatDateToApiDate(rawCheckOut, false);

    const url = `/api/Rooms/available?checkIn=${encodeURIComponent(checkInStr)}&checkOut=${encodeURIComponent(checkOutStr)}&hotelId=${this.hotelId}`;
    console.debug('Availability URL:', url);

    this.loading = true;
    const loadingTimer = setTimeout(() => {
      if (this.loading) {
        console.warn('Availability request timed out (15s), hiding spinner as fallback.');
        this.loading = false;
      }
    }, 15000);

    this.hotelService.getAvailableRooms(checkInStr, checkOutStr, this.hotelId).pipe(
      catchError(err => {
        console.warn('Server available API failed, will fallback to client-side', err);
        return of(null);
      })
    ).subscribe((response: any) => {
      clearTimeout(loadingTimer);

      let rooms: RoomDto[] = [];
      if (Array.isArray(response)) {
        rooms = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rooms = response.data;
      } else {
        rooms = [];
      }

      console.debug('Availability response (normalized):', rooms);

      if (rooms.length > 0) {
        this.availableRooms = rooms;
        console.debug('Assigned availableRooms (server):', this.availableRooms.length);
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      console.debug('Server returned no rooms; invoking client-side fallback');
      this.tryClientSideAvailability(new Date(rawCheckIn), new Date(rawCheckOut));
    }, (err) => {
      clearTimeout(loadingTimer);
      console.error('Unexpected error in availability call', err);
      this.loading = false;
      this.tryClientSideAvailability(new Date(rawCheckIn), new Date(rawCheckOut));
    });
  }

  private tryClientSideAvailability(checkInDate: Date, checkOutDate: Date): void {
    this.loading = true;

    console.debug('Client-side availability fallback: fetching rooms + reservations');

    const loadingTimer = setTimeout(() => {
      if (this.loading) {
        console.warn('Client-side availability taking long — hiding spinner.');
        this.loading = false;
      }
    }, 15000);

    forkJoin({
      roomsResp: this.hotelService.getRoomsByHotel(this.hotelId).pipe(catchError(() => of([]))),
      reservationsResp: this.reservationService.getReservations().pipe(catchError(() => of([])))
    }).subscribe(({ roomsResp, reservationsResp }: any) => {
      clearTimeout(loadingTimer);

      const rooms: RoomDto[] = Array.isArray(roomsResp) ? roomsResp : roomsResp?.data || [];
      const reservations: ReservationDto[] = Array.isArray(reservationsResp) ? reservationsResp : reservationsResp?.data || [];

      console.debug('Client-side fetched rooms/reservations', { roomsLength: rooms.length, reservationsLength: reservations.length });

      this.availableRooms = rooms.filter(r =>
        r.status === RoomStatus.Available &&
        !this.roomHasOverlap(r.id, reservations, checkInDate, checkOutDate)
      );

      console.debug('Assigned availableRooms (client):', this.availableRooms.length);
      this.loading = false;
      this.cdr.detectChanges();
    }, (err) => {
      clearTimeout(loadingTimer);
      console.error('Client-side availability fallback error', err);
      this.loading = false;
      this.availableRooms = [];
    });
  }

  private roomHasOverlap(roomId: number, reservations: ReservationDto[], checkIn: Date, checkOut: Date): boolean {
    return reservations.some(r => {
      if (r.roomId !== roomId || r.status === ReservationStatus.Cancelled) return false;
      const rIn = new Date(r.checkInDate as any);
      const rOut = new Date(r.checkOutDate as any);
      return (checkIn < rOut && checkOut > rIn);
    });
  }

  bookRoom(): void {
    if (!this.bookingForm.valid) { this.snackBar.open('Please fill all required fields and select a room.', 'OK', { duration: 4000 }); return; }

    const selectedRoomId = this.bookingForm.get('selectedRoomId')?.value;
    const rawCheckIn = this.bookingForm.get('checkInDate')?.value;
    const rawCheckOut = this.bookingForm.get('checkOutDate')?.value;

    const booking = {
      roomId: Number(selectedRoomId),
      hotelId: this.hotelId,
      checkInDate: this.formatDateToApiDate(rawCheckIn, true),
      checkOutDate: this.formatDateToApiDate(rawCheckOut, false),
      numberOfGuests: Number(this.bookingForm.get('numberOfGuests')?.value),
      guestEmail: this.bookingForm.get('guestEmail')?.value || null
    };

    console.debug('Attempting booking with payload:', booking);

    this.loading = true;
    this.cdr.detectChanges();
    this.reservationService.createReservation(booking).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.cdr.detectChanges();

        const _possibleReservation = (response?.success === true && response?.data) ? response.data : ((response && typeof response === 'object' && 'id' in response) ? response : null);
        if (_possibleReservation) {
          const reservation = _possibleReservation;
          const reservationId = reservation.id;

          const msg = 'Booking request sent! Status: Booked. Please wait for hotel confirmation.';
          this.snackBar.open(msg, 'View Reservations', { duration: 5000 })
            .onAction().subscribe(() => this.router.navigate(['/dashboard/reservations']));

          setTimeout(() => this.router.navigate(['/dashboard/reservations']), 1500);

        } else {
          const msg = response?.message || (Array.isArray(response?.errors) ? response.errors.join('; ') : 'Booking failed.');
          console.warn('Booking failed (server-side):', msg, response);
          setTimeout(() => this.snackBar.open(msg, 'OK', { duration: 7000 }), 0);
        }
      },
      error: (err: any) => {
        const serverMessage = err?.error?.message || (err?.error?.errors && Array.isArray(err.error.errors) ? err.error.errors.join('; ') : null);
        console.error('Booking failed (network/error):', err, serverMessage);
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.snackBar.open(serverMessage || 'Booking failed. Please try again.', 'OK', { duration: 7000 }), 0);
      }
    });
  }

  getRoomTypeText(type: RoomType): string {
    switch (type) {
      case RoomType.Single: return 'Single';
      case RoomType.Double: return 'Double';
      case RoomType.Suite: return 'Suite';
      case RoomType.Deluxe: return 'Deluxe';
      default: return 'Unknown';
    }
  }

  showRegisterGuest = false;
  guestForm: FormGroup;

  toggleRegisterGuest(): void {
    this.showRegisterGuest = !this.showRegisterGuest;
  }

  registerGuest(): void {
    if (this.guestForm.invalid) return;
    this.loading = true;
    this.auth.registerGuest(this.guestForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.snackBar.open('Guest registered successfully!', 'OK', { duration: 3000 });
          this.bookingForm.patchValue({ guestEmail: this.guestForm.value.email });
          this.showRegisterGuest = false;
          this.guestForm.reset({ password: 'Guest123!' });
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Registration failed';
        this.snackBar.open(msg, 'OK', { duration: 5000 });
      }
    });
  }
}
