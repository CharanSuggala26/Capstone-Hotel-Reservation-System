import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SeasonalRateService, SeasonalRateDto } from '../../../services/seasonal-rate';
import { HotelService } from '../../../services/hotel';
import { AuthService } from '../../../services/auth';
import { HotelDto } from '../../../models';

@Component({
    selector: 'app-seasonal-rates',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatTableModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './seasonal-rates.html',
    styleUrls: ['./seasonal-rates.css']
})
export class SeasonalRatesComponent implements OnInit {
    hotels: HotelDto[] = [];
    hotelControl = new FormControl<number | null>(null);
    selectedHotelId: number | null = null;

    rates: SeasonalRateDto[] = [];
    displayedColumns: string[] = ['name', 'multiplier', 'dates', 'actions'];

    rateForm: FormGroup;
    loading = false;

    constructor(
        private rateService: SeasonalRateService,
        private hotelService: HotelService,
        private auth: AuthService,
        private fb: FormBuilder,
        private snackBar: MatSnackBar
    ) {
        this.rateForm = this.fb.group({
            name: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            multiplier: [1.2, [Validators.required, Validators.min(0.1), Validators.max(10)]]
        });
    }

    ngOnInit(): void {
        this.loadHotels();
    }

    loadHotels(): void {
        if (this.auth.hasRole('Admin') || this.auth.hasRole('HotelManager')) {
            this.hotelService.getHotels().subscribe((res: any) => {
                const items = (res && res.data) || (Array.isArray(res) ? res : []);
                this.hotels = items;

                // If manager has only one hotel, auto-select
                if (this.hotels.length === 1) {
                    this.hotelControl.setValue(this.hotels[0].id);
                    this.onHotelChange();
                }
            });
        }
    }

    onHotelChange(): void {
        this.selectedHotelId = this.hotelControl.value;
        if (this.selectedHotelId) {
            this.loadRates();
        } else {
            this.rates = [];
        }
    }

    loadRates(): void {
        if (!this.selectedHotelId) return;
        this.loading = true;
        this.rateService.getRatesByHotel(this.selectedHotelId).subscribe({
            next: (res) => {
                this.rates = res.data || [];
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    addRate(): void {
        if (this.rateForm.invalid || !this.selectedHotelId) return;

        // Format dates to ISO
        const val = this.rateForm.value;
        const dto = {
            name: val.name,
            startDate: new Date(val.startDate).toISOString(),
            endDate: new Date(val.endDate).toISOString(),
            multiplier: Number(val.multiplier),
            hotelId: this.selectedHotelId
        };

        if (new Date(dto.endDate) <= new Date(dto.startDate)) {
            this.snackBar.open('End date must be after start date', 'OK', { duration: 3000 });
            return;
        }

        this.loading = true;
        this.rateService.createRate(dto).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.success) {
                    this.snackBar.open('Rate added successfully', 'OK', { duration: 3000 });
                    this.rateForm.reset({ multiplier: 1.2 });
                    this.loadRates();
                }
            },
            error: (err) => {
                this.loading = false;
                this.snackBar.open('Failed to add rate', 'OK', { duration: 3000 });
            }
        });
    }

    deleteRate(id: number): void {

        this.rateService.deleteRate(id).subscribe({
            next: (res) => {
                if (res.success) {
                    this.loadRates();
                }
            }
        });
    }
}
