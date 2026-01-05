import { Routes, createUrlTreeFromSnapshot, ActivatedRoute } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { Dashboard } from './layout/dashboard/dashboard';
import { HotelsComponent } from './features/hotel/hotels/hotels';
import { ReservationsComponent } from './features/reservation/reservations/reservations';
import { RoomBookingComponent } from './features/hotel/room-booking/room-booking';
import { authGuard } from './guards/auth-guard';
import { RoomsComponent } from './features/hotel/rooms/rooms';
import { Reports } from './features/admin/reports/reports';

import { Welcome } from './pages/welcome/welcome';

export const routes: Routes = [
  { path: '', component: Welcome },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'hotels', pathMatch: 'full' },
      { path: 'hotels', component: HotelsComponent },
      { path: 'hotels/:id/book', component: RoomBookingComponent },
      { path: 'reservations', component: ReservationsComponent },
      { path: 'bills', loadComponent: () => import('./features/billing/bills/bills').then(m => m.BillsComponent) },
      { path: 'bills/:id', loadComponent: () => import('./features/billing/bill-detail/bill-detail').then(m => m.BillDetailComponent) },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/user-list/user-list').then(m => m.UserListComponent),
        canActivate: [() => inject(AuthService).hasRole('Admin') ? true : createUrlTreeFromSnapshot(inject(ActivatedRoute).snapshot, ['/unauthorized'])]
      },
      {
        path: 'admin/users/:id/edit',
        loadComponent: () => import('./features/admin/user-edit/user-edit').then(m => m.UserEditComponent),
        canActivate: [() => inject(AuthService).hasRole('Admin') ? true : createUrlTreeFromSnapshot(inject(ActivatedRoute).snapshot, ['/unauthorized'])]
      },
      {
        path: 'admin/hotels',
        loadComponent: () => import('./features/admin/hotel-admin-list/hotel-admin-list').then(m => m.HotelAdminListComponent),
        canActivate: [() => inject(AuthService).hasRole('Admin') ? true : createUrlTreeFromSnapshot(inject(ActivatedRoute).snapshot, ['/unauthorized'])]
      },
      { path: 'admin/assign', loadComponent: () => import('./features/admin/assign-hotel/assign-hotel').then(m => m.AssignHotel), canActivate: [() => inject(AuthService).hasRole('Admin') ? true : createUrlTreeFromSnapshot(inject(ActivatedRoute).snapshot, ['/unauthorized'])] },
      {
        path: 'admin/reports', component: Reports, canActivate: [() => {
          const auth = inject(AuthService);
          return (auth.hasRole('Admin') || auth.hasRole('HotelManager')) ? true : createUrlTreeFromSnapshot(inject(ActivatedRoute).snapshot, ['/unauthorized']);
        }]
      },
      {
        path: 'admin/seasonal-rates',
        loadComponent: () => import('./features/admin/seasonal-rates/seasonal-rates').then(m => m.SeasonalRatesComponent),
        canActivate: [() => {
          const auth = inject(AuthService);
          return (auth.hasRole('Admin') || auth.hasRole('HotelManager')) ? true : createUrlTreeFromSnapshot(inject(ActivatedRoute).snapshot, ['/unauthorized']);
        }]
      },
      { path: 'rooms', loadComponent: () => import('./features/hotel/rooms/rooms').then(m => m.RoomsComponent) },
      { path: 'hotels/:id/rooms', loadComponent: () => import('./features/hotel/rooms/rooms').then(m => m.RoomsComponent) },
      {
        path: 'admin/hotels/new',
        loadComponent: () => import('./features/admin/hotel-edit/hotel-edit').then(m => m.HotelEditComponent),
        canActivate: [() => inject(AuthService).hasRole('Admin') ? true : createUrlTreeFromSnapshot(inject(ActivatedRoute).snapshot, ['/unauthorized'])]
      },
      {
        path: 'admin/hotels/:id/edit',
        loadComponent: () => import('./features/admin/hotel-edit/hotel-edit').then(m => m.HotelEditComponent),
        canActivate: [() => inject(AuthService).hasRole('Admin') ? true : createUrlTreeFromSnapshot(inject(ActivatedRoute).snapshot, ['/unauthorized'])]
      },
    ]
  },
  { path: 'unauthorized', loadComponent: () => import('./pages/unauthorized/unauthorized').then(m => m.UnauthorizedComponent) },
  { path: '**', redirectTo: '/login' }
];
