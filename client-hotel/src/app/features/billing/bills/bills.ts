import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
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
import { ReservationService } from '../../../services/reservation';
import { BillDto, PaymentStatus } from '../../../models';

@Component({
  selector: 'app-bills',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatCardModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './bills.html',
  styleUrls: ['./bills.css']
})
export class BillsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'userName', 'roomNumber', 'roomCharges', 'additionalCharges', 'taxAmount', 'totalAmount', 'paymentStatus', 'actions'];
  dataSource = new MatTableDataSource<BillDto>();
  loading = false;
  PaymentStatus = PaymentStatus;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private readonly reservationService: ReservationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadBills();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadBills(): void {
    this.loading = true;
    this.reservationService.getBills().subscribe({
      next: (response: any) => {
        this.loading = false;

        if (Array.isArray(response)) {
          this.dataSource.data = response;
        }

        else if (response?.success && response.data) {
          this.dataSource.data = response.data;
        }
        else {
          this.dataSource.data = [];
        }


        this.dataSource.data = this.dataSource.data.map(b => ({
          ...b,
          paymentStatus: typeof b.paymentStatus === 'string' ? (PaymentStatus as any)[b.paymentStatus] ?? b.paymentStatus : (b.paymentStatus ?? PaymentStatus.Pending)
        }));

        console.debug('Loaded bills (normalized):', this.dataSource.data);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading bills:', error);
      }
    });
  }

  getPaymentStatusText(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Pending: return 'Pending';
      case PaymentStatus.Paid: return 'Paid';
      case PaymentStatus.Refunded: return 'Refunded';
      default: return 'Unknown';
    }
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Pending: return 'accent';
      case PaymentStatus.Paid: return 'primary';
      case PaymentStatus.Refunded: return 'warn';
      default: return '';
    }
  }

  payBill(bill: BillDto): void {
    this.reservationService.processPayment(bill.id, bill.totalAmount).subscribe({
      next: () => {
        this.loadBills();
        this.snackBar.open('Payment processed', 'OK', { duration: 3000 });
      },
      error: (error) => {
        console.error('Payment failed:', error);
        this.snackBar.open('Payment failed. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }

  goToBill(billId: number): void {
    this.router.navigate(['/dashboard/bills', billId]);
  }
}
