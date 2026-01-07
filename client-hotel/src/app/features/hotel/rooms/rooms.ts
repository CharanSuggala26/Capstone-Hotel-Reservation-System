import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { HotelService } from '../../../services/hotel';
import { AuthService } from '../../../services/auth';
import { RoomDto, RoomType, RoomStatus, HotelDto } from '../../../models';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    RouterModule
  ],
  templateUrl: './rooms.html',
  styleUrls: ['./rooms.css']
})
export class RoomsComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = ['roomNumber', 'type', 'capacity', 'basePrice', 'status', 'hotelName', 'actions'];
  dataSource = new MatTableDataSource<RoomDto>([]);
  roomForm: FormGroup;
  editing = false;
  hotelIdFromRoute: number | null = null;

  hotels: HotelDto[] = [];
  isAdmin = false;
  isManager = false;

  @ViewChild(MatSort) sort!: MatSort;

  roomTypes = [
    { value: RoomType.Single, label: 'Single' },
    { value: RoomType.Double, label: 'Double' },
    { value: RoomType.Suite, label: 'Suite' },
    { value: RoomType.Deluxe, label: 'Deluxe' }
  ];

  roomStatuses = [
    { value: RoomStatus.Available, label: 'Available' },
    { value: RoomStatus.Occupied, label: 'Occupied' },
    { value: RoomStatus.Maintenance, label: 'Maintenance' }
  ];

  private readonly destroy$ = new Subject<void>();


  filterType: number | null = null;
  filterStatus: number | null = null;
  filterPriceMin: number | null = null;
  filterPriceMax: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly hotelService: HotelService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.roomForm = this.fb.group({
      id: [null],
      roomNumber: ['', Validators.required],
      type: [RoomType.Single, Validators.required],
      capacity: [1, [Validators.required, Validators.min(1)]],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      status: [RoomStatus.Available, Validators.required],
      hotelId: [null, Validators.required]
    });
  }

  ngOnInit(): void {

    this.dataSource.filterPredicate = (data: RoomDto, filter: string) => {

      const matchType = this.filterType === null || data.type === this.filterType;
      const matchStatus = this.filterStatus === null || data.status === this.filterStatus;
      const matchMin = this.filterPriceMin === null || data.basePrice >= this.filterPriceMin;
      const matchMax = this.filterPriceMax === null || data.basePrice <= this.filterPriceMax;



      return matchType && matchStatus && matchMin && matchMax;
    };


    const idParam = this.route.snapshot.paramMap.get('id');
    this.hotelIdFromRoute = idParam ? Number(idParam) : null;
    if (this.hotelIdFromRoute) {
      this.roomForm.patchValue({ hotelId: this.hotelIdFromRoute });
    }


    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAdmin = this.auth.hasRole('Admin');
        this.isManager = this.auth.hasRole('HotelManager');


        if (this.isManager && (user as any)?.hotelId && !this.hotelIdFromRoute) {
          this.hotelIdFromRoute = (user as any).hotelId;
          this.roomForm.patchValue({ hotelId: this.hotelIdFromRoute });
        }


        if (this.isAdmin || this.isManager) {
          this.hotelService.getHotels()
            .pipe(takeUntil(this.destroy$))
            .subscribe((res: any) => {
              let items = res?.data || (Array.isArray(res) ? res : []);

              if (this.isManager) {
                const userHotelId = (user as any)?.hotelId;
                if (userHotelId) {
                  items = items.filter((h: any) => h.id === userHotelId);
                  this.hotelIdFromRoute = userHotelId;
                  this.roomForm.patchValue({ hotelId: userHotelId });
                }
              }

              setTimeout(() => {
                this.hotels = items;

                if (!this.roomForm.value.hotelId && this.hotels.length === 1) {
                  this.roomForm.patchValue({ hotelId: this.hotels[0].id });
                }
                this.cdr.detectChanges();
              });
              this.reload();
            });
        } else {
          this.reload();
        }
      });

    this.roomForm.get('hotelId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.reload());
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }


  applyCustomFilter(): void {
    this.dataSource.filter = '' + Math.random();
  }

  clearFilters(): void {
    this.filterType = null;
    this.filterStatus = null;
    this.filterPriceMin = null;
    this.filterPriceMax = null;
    this.applyCustomFilter();
  }



  loadAllRooms(): void {
    this.hotelService.getRooms().pipe(takeUntil(this.destroy$)).subscribe(res => {
      const items = (res && (res as any).data) || (Array.isArray(res) ? res : []);
      this.dataSource.data = items;
    });
  }


  loadRoomsByHotel(hotelId: number): void {
    this.hotelService.getRoomsByHotel(hotelId).pipe(takeUntil(this.destroy$)).subscribe(res => {
      const items = (res && (res as any).data) || (Array.isArray(res) ? res : []);
      this.dataSource.data = items;
    });
  }

  startEdit(room: RoomDto): void {
    this.editing = true;
    this.roomForm.patchValue(room);
  }

  cancelEdit(): void {
    this.editing = false;
    this.roomForm.reset({
      type: RoomType.Single,
      status: RoomStatus.Available,
      capacity: 1,
      basePrice: 0,
      hotelId: this.hotelIdFromRoute ?? null
    });
  }

  save(): void {
    if (this.roomForm.invalid) return;

    const value = this.roomForm.value;
    if (this.editing && value.id) {
      this.hotelService.updateRoom(value.id, value).subscribe({
        next: (res: any) => {
          // Backend returns the updated RoomDto, or standard OK.
          // If we reach here, it's a success.
          this.snackBar.open('Room updated successfully', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['success-snackbar']
          });
          this.reload();
          this.cancelEdit();
        },
        error: (err: any) => {
          console.error('Update room error', err);
          const msg = err?.error?.message || 'Failed updating room';
          this.snackBar.open(msg, 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.hotelService.createRoom(value).subscribe({
        next: (res: any) => {
          // Backend returns the created RoomDto
          this.snackBar.open('Room created successfully', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['success-snackbar']
          });
          this.reload();
          this.cancelEdit();
        },
        error: (err: any) => {
          console.error('Create room error', err);
          const msg = err?.error?.message || 'Failed creating room';
          this.snackBar.open(msg, 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  deleteRoom(id: number): void {
    // confirm check removed as per user request

    this.hotelService.deleteRoom(id).subscribe({
      next: () => {
        // Backend returns 204 No Content
        this.snackBar.open('Room deleted successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['success-snackbar']
        });
        this.reload();
      },
      error: (err: any) => {
        console.error('Delete room error', err);
        const msg = err?.error?.message || 'Failed deleting room';
        this.snackBar.open(msg, 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
      }
    });
  }


  onHotelSelectionChange(): void {
    this.reload();
  }

  reload(): void {
    const selectedHotelId = this.roomForm.value.hotelId ?? this.hotelIdFromRoute;
    if (selectedHotelId) {
      this.loadRoomsByHotel(Number(selectedHotelId));
    } else {
      this.loadAllRooms();
    }
  }

  displayType(t: RoomType): string {
    return this.roomTypes.find(x => x.value === t)?.label ?? String(t);
  }

  displayStatus(s: RoomStatus): string {
    return this.roomStatuses.find(x => x.value === s)?.label ?? String(s);
  }



  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}