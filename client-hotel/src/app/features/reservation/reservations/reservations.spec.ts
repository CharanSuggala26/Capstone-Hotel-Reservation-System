import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { ReservationsComponent } from './reservations';
import { ReservationService } from '../../../services/reservation';
import { AuthService } from '../../../services/auth';
import { ReservationDto, ReservationStatus } from '../../../models';

describe('ReservationsComponent', () => {
  let component: ReservationsComponent;
  let fixture: ComponentFixture<ReservationsComponent>;
  let reservationServiceSpy: any;
  let authServiceSpy: any;
  let snackBarSpy: any;

  beforeEach(async () => {
    reservationServiceSpy = {
      getReservations: vi.fn(),
      getAllReservations: vi.fn(),
      confirmReservation: vi.fn(),
      cancelReservation: vi.fn(),
      checkIn: vi.fn(),
      checkOut: vi.fn(),
      createBill: vi.fn()
    };
    authServiceSpy = {
      hasRole: vi.fn()
    };
    snackBarSpy = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        ReservationsComponent, // Independent (standalone) component
        HttpClientTestingModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: ReservationService, useValue: reservationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationsComponent);
    component = fixture.componentInstance;
  });

  const mockReservations: ReservationDto[] = [
    {
      id: 1,
      roomNumber: '101',
      hotelName: 'Hotel A',
      status: ReservationStatus.Booked,
      totalAmount: 100,
      checkInDate: new Date(),
      checkOutDate: new Date(),
      numberOfGuests: 2,
      createdAt: new Date(),
      userId: 'u1',
      userName: 'User 1',
      roomId: 1,
      hotelId: 1
    },
    {
      id: 2,
      roomNumber: '102',
      hotelName: 'Hotel A',
      status: ReservationStatus.Confirmed,
      totalAmount: 150,
      checkInDate: new Date(),
      checkOutDate: new Date(),
      numberOfGuests: 2,
      createdAt: new Date(),
      userId: 'u1',
      userName: 'User 1',
      roomId: 1,
      hotelId: 1
    }
  ];

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user reservations for Guest', fakeAsync(() => {
    authServiceSpy.hasRole.mockImplementation((role: any) => role === 'Guest');
    reservationServiceSpy.getReservations.mockReturnValue(of(mockReservations));

    component.ngOnInit();
    tick(); // Wait for setTimeout in loadReservations

    expect(reservationServiceSpy.getReservations).toHaveBeenCalled();
    expect(component.dataSource.data).toEqual(mockReservations);
    expect(component.dataSource.data.length).toBe(2);
  }));

  it('should load all reservations for HotelManager', fakeAsync(() => {
    authServiceSpy.hasRole.mockImplementation((role: any) => role === 'HotelManager');
    reservationServiceSpy.getAllReservations.mockReturnValue(of(mockReservations));

    component.ngOnInit();
    tick();

    expect(reservationServiceSpy.getAllReservations).toHaveBeenCalled();
    expect(component.displayedColumns).toContain('userName');
  }));

  it('canConfirm should return true only for HotelManager/Admin and Booked status', () => {
    const res = { ...mockReservations[0], status: ReservationStatus.Booked };

    authServiceSpy.hasRole.mockImplementation((role: any) => role === 'HotelManager');
    expect(component.canConfirm(res)).toBe(true);

    authServiceSpy.hasRole.mockReturnValue(false); // No roles
    expect(component.canConfirm(res)).toBe(false);

    res.status = ReservationStatus.Confirmed;
    authServiceSpy.hasRole.mockReturnValue(true);
    expect(component.canConfirm(res)).toBe(false);
  });

  it('cancelReservation should call service and reload on success', fakeAsync(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    reservationServiceSpy.cancelReservation.mockReturnValue(of(true));
    reservationServiceSpy.getReservations.mockReturnValue(of([])); // For reload
    authServiceSpy.hasRole.mockReturnValue(true); // For load check

    component.cancelReservation(1);

    expect(reservationServiceSpy.cancelReservation).toHaveBeenCalledWith(1);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Reservation cancelled', 'Close', expect.any(Object));

    tick(); // for loadReservations setTimeout
    expect(reservationServiceSpy.getAllReservations).toHaveBeenCalled(); // Since hasRole is true (Admin mocked effectively)
  }));
});
