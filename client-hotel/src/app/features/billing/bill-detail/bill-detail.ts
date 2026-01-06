import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import jsPDF from 'jspdf';
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
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly reservationService: ReservationService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly snackBar: MatSnackBar
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

  downloadInvoice(): void {
    if (!this.bill) return;

    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(40, 40, 40);
    doc.text('Charan Hotels', margin, y);
    y += 10;

    // Sub-header (Specific Hotel Name)
    if (this.bill.hotelName) {
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(this.bill.hotelName, margin, y);
      y += 10;
    }

    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text('INVOICE', margin, y);
    y += 15;

    // Bill Details Box
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 5, 170, 45, 'F');

    // Bill Info
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Bill ID: #${this.bill.id}`, margin, y);
    y += 7;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, y);
    y += 7;
    doc.text(`Guest: ${this.bill.userName}`, margin, y);
    y += 7;
    doc.text(`Room: ${this.bill.roomNumber}`, margin, y);
    y += 15;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 10;

    // details
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);

    doc.text('Description', margin, y);
    doc.text('Amount', 150, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);

    // Items
    doc.text('Room Charges', margin, y);
    doc.text(`$${this.bill.roomCharges}`, 150, y);
    y += 8;

    doc.text('Additional Charges', margin, y);
    doc.text(`$${this.bill.additionalCharges}`, 150, y);
    y += 8;

    doc.text('Tax', margin, y);
    doc.text(`$${this.bill.taxAmount}`, 150, y);
    y += 12;

    // Total
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, 190, y);
    y += 10;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount', margin, y);
    doc.text(`$${this.bill.totalAmount}`, 150, y);

    y += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const status = this.getText(this.bill.paymentStatus);
    doc.setTextColor(status === 'Paid' ? 'green' : 'red');
    doc.text(`Status: ${status}`, margin, y);

    // Save
    doc.save(`Invoice_Bill_${this.bill.id}.pdf`);
  }

  isPaid(): boolean {
    if (!this.bill) return false;
    // Check both enum value and potential string/number mismatch
    return this.bill.paymentStatus === PaymentStatus.Paid ||
      (this.bill.paymentStatus as any) === 2 ||
      (this.bill.paymentStatus as any) === 'Paid';
  }
}

