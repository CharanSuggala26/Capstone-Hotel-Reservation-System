import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
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

  private destroy$ = new Subject<void>();

  // Filters
  filterType: number | null = null;
  filterStatus: number | null = null;
  filterPriceMin: number | null = null;
  filterPriceMax: number | null = null;

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
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
    // Custom filter predicate
    this.dataSource.filterPredicate = (data: RoomDto, filter: string) => {
      // Logic combines specific filters
      const matchType = this.filterType === null || data.type === this.filterType;
      const matchStatus = this.filterStatus === null || data.status === this.filterStatus;
      const matchMin = this.filterPriceMin === null || data.basePrice >= this.filterPriceMin;
      const matchMax = this.filterPriceMax === null || data.basePrice <= this.filterPriceMax;

      // General string search if entered (optional, can keep separate)
      // filter string handles the "general" search if we had one, but we are replacing with dropdowns.
      // If we want to keep the text search too:
      // const searchStr = filter.toLowerCase();
      // const matchText = data.roomNumber.toLowerCase().includes(searchStr); 

      return matchType && matchStatus && matchMin && matchMax;
    };

    // ... existing init code ...
    // route param override
    const idParam = this.route.snapshot.paramMap.get('id');
    this.hotelIdFromRoute = idParam ? Number(idParam) : null;
    if (this.hotelIdFromRoute) {
      this.roomForm.patchValue({ hotelId: this.hotelIdFromRoute });
    }

    // react to user/roles and load hotels (for selector)
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAdmin = this.auth.hasRole('Admin');
        this.isManager = this.auth.hasRole('HotelManager');

        // auto-assign manager's hotel if user payload contains it and no route override
        if (this.isManager && (user as any)?.hotelId && !this.hotelIdFromRoute) {
          this.hotelIdFromRoute = (user as any).hotelId;
          this.roomForm.patchValue({ hotelId: this.hotelIdFromRoute });
        }

        // If Admin or Manager, load hotels for selector (allow switching)
        if (this.isAdmin || this.isManager) {
          this.hotelService.getHotels()
            .pipe(takeUntil(this.destroy$))
            .subscribe((res: any) => {
              const items = (res && res.data) || (Array.isArray(res) ? res : []);
              setTimeout(() => {
                this.hotels = items;
                // If there is no hotelId yet but hotels list exists, optionally set default
                if (!this.roomForm.value.hotelId && this.hotels.length === 1) {
                  this.roomForm.patchValue({ hotelId: this.hotels[0].id });
                }
              });
              this.reload(); // Reload happens independently of UI list update
            });
        } else {
          // Non-admin/non-manager: just load all rooms or based on route param
          this.reload();
        }
      });

    this.roomForm.get('hotelId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.reload());
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  // Trigger filtering
  applyCustomFilter(): void {
    // We toggle the filter string just to trigger the predicate. 
    // The value doesn't matter much if we use the class properties in predicate directly, 
    // but Angular Material Table expects a filter string change to re-run.
    this.dataSource.filter = '' + Math.random();
  }

  clearFilters(): void {
    this.filterType = null;
    this.filterStatus = null;
    this.filterPriceMin = null;
    this.filterPriceMax = null;
    this.applyCustomFilter();
  }

  // Previous applyFilter() removed as we replaced it

  // ... rest of methods ...

  loadAllRooms(): void {
    this.hotelService.getRooms().pipe(takeUntil(this.destroy$)).subscribe(res => {
      const items = (res && (res as any).data) || (Array.isArray(res) ? res : []);
      this.dataSource.data = items;
    });
  }
  // ... and so on ...

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
      this.hotelService.updateRoom(value.id, value).subscribe((res: any) => {
        if (res?.success !== false) {
          this.snackBar.open('Room updated successfully', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['success-snackbar']
          });
          this.reload();
          this.cancelEdit();
        } else {
          this.snackBar.open(res?.message || 'Failed updating room', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.hotelService.createRoom(value).subscribe((res: any) => {
        if (res?.success !== false) {
          this.snackBar.open('Room created successfully', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['success-snackbar']
          });
          this.reload();
          this.cancelEdit();
        } else {
          this.snackBar.open(res?.message || 'Failed creating room', 'Close', {
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
    if (!confirm('Delete this room?')) return;
    this.hotelService.deleteRoom(id).subscribe((res: any) => {
      if (res?.success !== false) {
        this.snackBar.open('Room deleted successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['success-snackbar']
        });
        this.reload();
      } else {
        this.snackBar.open(res?.message || 'Failed deleting room', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // <-- NEW: called from template selectionChange()
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

  // ... inside RoomsComponent ...

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}