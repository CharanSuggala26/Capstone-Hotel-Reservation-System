import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HotelService } from '../../../services/hotel';
import { HotelDto } from '../../../models';

@Component({
    selector: 'app-hotel-edit',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        RouterModule
    ],
    templateUrl: './hotel-edit.html',
    styleUrl: './hotel-edit.css'
})
export class HotelEditComponent implements OnInit {
    hotelForm: FormGroup;
    hotelId: number | null = null;
    isEditMode = false;

    constructor(
        private fb: FormBuilder,
        private hotelService: HotelService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.hotelForm = this.fb.group({
            name: ['', [Validators.required]],
            address: ['', [Validators.required]],
            city: ['', [Validators.required]],
            phone: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.hotelId = +idParam;
            this.isEditMode = true;
            this.loadHotel(this.hotelId);
        }
    }

    loadHotel(id: number): void {
        this.hotelService.getHotel(id).subscribe((response: any) => {
            const hotel = response.data || response;
            if (hotel) {
                this.hotelForm.patchValue({
                    name: hotel.name,
                    address: hotel.address,
                    city: hotel.city,
                    phone: hotel.phone,
                    email: hotel.email
                });
            }
        });
    }

    onSubmit(): void {
        if (this.hotelForm.valid) {
            const hotelData = this.hotelForm.value;

            if (this.isEditMode && this.hotelId) {
                this.hotelService.updateHotel(this.hotelId, hotelData).subscribe((response: any) => {
                    if (response.success !== false) {
                        this.router.navigate(['/dashboard/admin/hotels']);
                    }
                });
            } else {
                this.hotelService.createHotel(hotelData).subscribe((response: any) => {
                    if (response.success !== false) {
                        this.router.navigate(['/dashboard/admin/hotels']);
                    }
                });
            }
        }
    }
}
