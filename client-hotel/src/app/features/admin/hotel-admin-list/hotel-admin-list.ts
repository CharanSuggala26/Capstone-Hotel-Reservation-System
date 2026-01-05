import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HotelService } from '../../../services/hotel';
import { HotelDto } from '../../../models';
import { Router, RouterModule, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-hotel-admin-list',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatSortModule, MatButtonModule, MatIconModule, MatCardModule, RouterModule, RouterLink],
    templateUrl: './hotel-admin-list.html',
    styleUrl: './hotel-admin-list.css'
})
export class HotelAdminListComponent implements OnInit, AfterViewInit {
    displayedColumns: string[] = ['name', 'city', 'phone', 'totalRooms', 'actions'];
    dataSource = new MatTableDataSource<HotelDto>();
    router: any;

    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private hotelService: HotelService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadHotels();
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
    }

    loadHotels(): void {
        this.hotelService.getHotels().subscribe((response: any) => {
            const hotels = Array.isArray(response) ? response : (response.data || []);
            this.dataSource.data = hotels;
            this.cdr.detectChanges(); // Force detection to resolve NG0100
        });
    }

    deleteHotel(id: number): void {
        this.hotelService.deleteHotel(id).subscribe((response: any) => {
            if (response.success !== false) {
                this.loadHotels();
            }
        });
    }

    editHotelAdmin(id: number | null): void {
        if (!id) {
            console.warn('editHotelAdmin called with invalid id:', id);
            return;
        }
        console.log('Navigating to edit hotel with id:', id);
        this.router.navigate(['/dashboard/admin/hotels', id, 'edit']);
    }
}
