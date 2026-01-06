import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ReservationService } from '../../../services/reservation';
import { AuthService } from '../../../services/auth';
import { BillDto, PaymentStatus } from '../../../models';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, MatSnackBarModule],
  templateUrl: './bill-detail.html',
  styleUrls: ['./bill-detail.css']
})
export class BillDetailComponent implements OnInit {
  bill?: BillDto;
  loading = true;
  PaymentStatus = PaymentStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (!id) {
      this.router.navigate(['/dashboard/bills']);
      return;
    }
    this.loadBill(id);
  }

  loadBill(id: number): void {
    this.loading = true;
    this.reservationService.getBill(id).subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (Array.isArray(resp)) {
          this.bill = resp[0];
        } else if (resp?.data) {
          this.bill = resp.data;
        } else if (resp) {
          this.bill = resp;
        } else {
          this.bill = undefined;
        }

        // Normalizing the bill paymentStatus 
        if (this.bill) {
          if (typeof (this.bill as any).paymentStatus === 'string') {
            const ps = (PaymentStatus as any)[(this.bill as any).paymentStatus];
            (this.bill as any).paymentStatus = ps ?? (this.bill as any).paymentStatus;
          }
          if ((this.bill as any).paymentStatus == null) {
            (this.bill as any).paymentStatus = PaymentStatus.Pending;
          }
        }

        console.debug('Loaded bill (normalized):', this.bill);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load bill', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  pay(): void {
    if (!this.bill) return;
    this.loading = true;
    this.reservationService.processPayment(this.bill.id, this.bill.totalAmount).subscribe({
      next: () => {
        // Refreshing the bill
        this.loadBill(this.bill!.id);
        this.snackBar.open('Payment successful', 'OK', { duration: 3000 });
      },
      error: (err) => {
        console.error('Payment failed', err);
        const errorMsg = err.error?.message || err.error?.title || err.statusText || 'Unknown error';
        const valErrors = err.error?.errors ? JSON.stringify(err.error.errors) : '';

        this.loading = false;
        this.cdr.detectChanges();

        this.snackBar.open(`Payment failed: ${errorMsg} ${valErrors}`, 'OK', { duration: 7000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/bills']);
  }

  getText(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Pending: return 'Pending';
      case PaymentStatus.Paid: return 'Paid';
      case PaymentStatus.Refunded: return 'Refunded';
      default: return 'Unknown';
    }
  }

  getColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Pending: return 'accent';
      case PaymentStatus.Paid: return 'primary';
      case PaymentStatus.Refunded: return 'warn';
      default: return '';
    }
  }
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }
}

