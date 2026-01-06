import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin, of, Subscription, interval } from 'rxjs';
import { catchError, finalize, take } from 'rxjs/operators';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

import { HotelService } from '../../../services/hotel';
import { ReservationService } from '../../../services/reservation';
import { UserService } from '../../../services/user';
import { AuthService } from '../../../services/auth';
import { ReservationStatus } from '../../../models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class Reports implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  loading = true;

  stats = {
    totalRevenue: 0,
    occupancyRate: 0,
    activeReservations: 0,
    totalUsers: 0,
    totalHotels: 0
  };

  public lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public doughnutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };

  private refreshSubscription: Subscription | null = null;
  private readonly isBrowser: boolean;

  constructor(
    private readonly hotelService: HotelService,
    private readonly reservationService: ReservationService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.fetchData();

    // Refreshing data for every 3 secondshis
    if (this.isBrowser) {
      this.refreshSubscription = interval(3000).subscribe(() => {
        this.fetchData(true);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  fetchData(isBackground: boolean = false): void {
    if (!isBackground) {
      this.loading = true;
    }

    forkJoin({
      hotels: this.hotelService.getHotels().pipe(catchError(() => of([]))),
      reservations: this.reservationService.getAllReservations().pipe(catchError(() => of([]))),
      users: this.userService.getAllUsers(1, 1000).pipe(catchError(() => of({ totalCount: 0 }))),
      bills: this.reservationService.getBills().pipe(catchError(() => of([])))
    }).pipe(
      take(1),
      finalize(() => {
        if (!isBackground) {
          this.loading = false;
        }
        this.cdr.detectChanges();
      })
    ).subscribe((res: any) => {
      this.processData(res);
    });
  }

  private processData(res: any) {
    let hotels = res.hotels?.data || res.hotels || [];
    let reservations = res.reservations?.data || res.reservations || [];
    let bills = res.bills?.data || res.bills || [];
    const userResult = res.users?.data || res.users;

    // Filtering data for Hotel Manager (i.e for Hotel Manager Portal Stats)
    if (this.authService.hasRole('HotelManager')) {
      const hotelId = this.authService.getCurrentUser()?.hotelId;
      if (hotelId) {
        hotels = hotels.filter((h: any) => h.id === hotelId);
        reservations = reservations.filter((r: any) => r.hotelId === hotelId);

        const reservationIds = new Set(reservations.map((r: any) => r.id));
        bills = bills.filter((b: any) => reservationIds.has(b.reservationId));
      } else {
        // If Hotel Manager has no hotel assigned then i'll show nothing
        hotels = [];
        reservations = [];
        bills = [];
      }
    }

    this.stats.totalHotels = hotels.length;

    // Calculating Revenue based on Bookings and Payments to show immediate stats
    const validReservations = reservations.filter((r: any) =>
      r.status !== ReservationStatus.Cancelled && r.status !== 5
    );

    this.stats.totalRevenue = validReservations
      .reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);

    const totalRooms = hotels.reduce((sum: number, h: any) => sum + (h.totalRooms || 0), 0) || 1;
    this.stats.activeReservations = reservations.filter((r: any) =>
      r.status === ReservationStatus.CheckedIn || r.status === 3
    ).length;

    // Calculating Occupancy based on date overlap and active status (Booked, Confirmed, CheckedIn)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const occupiedRooms = reservations.filter((r: any) => {
      const status = r.status;
      const isActive =
        status === ReservationStatus.Booked || status === 1 ||
        status === ReservationStatus.Confirmed || status === 2 ||
        status === ReservationStatus.CheckedIn || status === 3;

      if (!isActive) return false;

      const checkIn = new Date(r.checkInDate);
      const checkOut = new Date(r.checkOutDate);
      // Normalizing the dates to compare only days
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);

      // Occupied if today is within [checkIn, checkOut]
      return today >= checkIn && today < checkOut;
    }).length;

    this.stats.occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

    if (this.authService.hasRole('HotelManager')) {
      // For Hotel Manager, count unique guests who have reservations at this hotel
      this.stats.totalUsers = new Set(reservations.map((r: any) => r.userId)).size;
    } else {
      this.stats.totalUsers = userResult?.totalCount || 0;
    }


    const last6Months = [];
    const revenueByMonth = new Array(6).fill(0);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last6Months.push(d.toLocaleString('default', { month: 'short' }));
    }

    // Processing Revenue per Month using CheckInDate (Projected Activity)
    validReservations.forEach((r: any) => {
      const checkIn = new Date(r.checkInDate);
      const diffMonths = (today.getFullYear() - checkIn.getFullYear()) * 12 + (today.getMonth() - checkIn.getMonth());

      if (diffMonths >= 0 && diffMonths < 6) {
        const index = 5 - diffMonths;
        revenueByMonth[index] += (r.totalAmount || 0);
      }
    });

    this.lineChartData = {
      labels: last6Months,
      datasets: [{
        label: 'Revenue',
        data: revenueByMonth,
        borderColor: '#4e73df',
        backgroundColor: 'rgba(78, 115, 223, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    this.doughnutChartData = {
      labels: ['Booked', 'Checked In', 'Cancelled'],
      datasets: [{
        data: [
          reservations.filter((r: any) => r.status === 1 || r.status === ReservationStatus.Booked).length,
          reservations.filter((r: any) => r.status === 3 || r.status === ReservationStatus.CheckedIn).length,
          reservations.filter((r: any) => r.status === 5 || r.status === ReservationStatus.Cancelled).length
        ],
        backgroundColor: ['#4e73df', '#1cc88a', '#e74a3b']
      }]
    };

    this.chart?.update();
  }
}