import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { HotelService } from '../../../services/hotel';
import { AuthService } from '../../../services/auth';
import { HotelDto, RoomDto } from '../../../models';

import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-hotels',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './hotels.html',
  styleUrl: './hotels.css'
})
export class HotelsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'city', 'phone', 'email', 'totalRooms', 'actions'];
  dataSource = new MatTableDataSource<HotelDto>();
  loading = false;

  hotels: HotelDto[] = [];
  filteredHotels: HotelDto[] = [];
  recommendedRooms: RoomDto[] = [];
  searchText = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private hotelService: HotelService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadHotels();
    if (this.hasRole('Guest')) {
      this.loadRecommendations();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadHotels(): void {
    this.loading = true;
    this.hotelService.getHotels().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : (response.data || []);
        this.hotels = data;

        // Filter based on assigned hotel
        const user = this.authService.getCurrentUser();
        if (user && (this.hasRole('HotelManager') || this.hasRole('Receptionist')) && user.hotelId) {
          this.hotels = this.hotels.filter(h => h.id === user.hotelId);
        }

        this.filteredHotels = this.hotels;
        this.dataSource.data = this.hotels;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.cdr.detectChanges();
        console.error('❌ Error loading hotels:', error);
      }
    });
  }

  applyFilter(): void {
    const term = this.searchText.toLowerCase().trim();
    if (!term) {
      this.filteredHotels = this.hotels;
    } else {
      this.filteredHotels = this.hotels.filter(h =>
        h.name.toLowerCase().includes(term) ||
        h.city.toLowerCase().includes(term)
      );
    }
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  loadRecommendations(): void {
    this.hotelService.getRecommendedRooms().subscribe({
      next: (rooms) => {
        this.recommendedRooms = rooms;
      },
      error: (err) => {
        console.error('Failed to load recommendations', err);
      }
    });
  }

  getRoomTypeName(type: number): string {
    switch (type) {
      case 1: return 'Single';
      case 2: return 'Double';
      case 3: return 'Suite';
      case 4: return 'Deluxe';
      default: return 'Unknown';
    }
  }
}
