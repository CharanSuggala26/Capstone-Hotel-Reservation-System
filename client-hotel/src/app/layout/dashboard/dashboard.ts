import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { UserDto, NotificationDto } from '../../models';
import { interval, Subscription, switchMap, filter, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  currentUser: UserDto | null = null;
  notifications: NotificationDto[] = [];
  unreadCount: number = 0;
  private pollingSubscription: Subscription | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadNotifications();
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    this.stopPolling();

    // Poll every 30 seconds for Background service message notifictaions
    this.pollingSubscription = interval(30000).pipe(
      filter(() => !!this.currentUser),
      switchMap(() => this.userService.getNotifications(this.currentUser!.id).pipe(
        catchError(err => {
          // If backend is down, we don't want to crash the poller or spam too much
          // We effectively swallow the error for this interval tick
          return of({ success: false, data: [] });
        })
      ))
    ).subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          this.handleNewNotifications(response.data);
        }
      },
      error: (err) => {
        // This should ideally not be reached due to catchError above, 
        // but as a safety net if the interval itself fails
        console.warn('Notification polling stream error', err);
      }
    });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  handleNewNotifications(newNotifications: NotificationDto[]): void {
    const previousCount = this.notifications.length;


    if (newNotifications.length > previousCount) {
      const latestInfo = newNotifications[0];
      if (!latestInfo.isRead && !this.notifications.some(n => n.id === latestInfo.id)) {
        this.snackBar.open(latestInfo.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['notification-snackbar']
        });
      }
    }

    this.notifications = newNotifications;
    this.updateUnreadCount();
  }

  loadNotifications(): void {
    if (!this.currentUser) return;

    this.userService.getNotifications(this.currentUser.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          setTimeout(() => {
            this.notifications = response.data || [];
            this.updateUnreadCount();
          });
        }
      }
    });
  }

  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    this.cdr.detectChanges();
  }

  markAsRead(notification: NotificationDto): void {
    if (notification.isRead || !this.currentUser) return;

    this.userService.markNotificationAsRead(this.currentUser.id, notification.id).subscribe({
      next: (response) => {
        if (response.success) {
          notification.isRead = true;
          this.updateUnreadCount();
        }
      }
    });
  }

  logout(): void {
    this.stopPolling();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }
}
