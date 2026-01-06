import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import jsPDF from 'jspdf';
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

  isPaid(bill: BillDto): boolean {
    if (!bill) return false;
    return bill.paymentStatus === PaymentStatus.Paid ||
      (bill.paymentStatus as any) === 2 ||
      (bill.paymentStatus as any) === 'Paid';
  }

  downloadInvoice(bill: BillDto): void {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(40, 40, 40);
    doc.text('Charan Hotels', margin, y);
    y += 10;

    // Sub-header (Specific Hotel Name)
    if (bill.hotelName) {
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(bill.hotelName, margin, y);
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
    doc.text(`Bill ID: #${bill.id}`, margin, y);
    y += 7;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, y);
    y += 7;
    doc.text(`Guest: ${bill.userName}`, margin, y);
    y += 7;
    doc.text(`Room: ${bill.roomNumber}`, margin, y);
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
    doc.text(`$${bill.roomCharges}`, 150, y);
    y += 8;

    doc.text('Additional Charges', margin, y);
    doc.text(`$${bill.additionalCharges}`, 150, y);
    y += 8;

    doc.text('Tax', margin, y);
    doc.text(`$${bill.taxAmount}`, 150, y);
    y += 12;

    // Total
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, 190, y);
    y += 10;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount', margin, y);
    doc.text(`$${bill.totalAmount}`, 150, y);

    y += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const status = this.getPaymentStatusText(bill.paymentStatus);
    doc.setTextColor(status === 'Paid' ? 'green' : 'red');
    doc.text(`Status: ${status}`, margin, y);

    // Save
    doc.save(`Invoice_Bill_${bill.id}.pdf`);
  }
}
