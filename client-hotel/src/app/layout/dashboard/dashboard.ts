import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { interval, Subscription, switchMap, of, filter } from 'rxjs';

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
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
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

    // Poll every 30 seconds
    this.pollingSubscription = interval(30000).pipe(
      filter(() => !!this.currentUser),
      switchMap(() => this.userService.getNotifications(this.currentUser!.id))
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.handleNewNotifications(response.data);
        }
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

    // Check for truly new notifications (by ID) which are unread
    // Note: This logic assumes simple ID comparison. 
    // Ideally we track 'last known max ID'.

    if (newNotifications.length > previousCount) {
      const latestInfo = newNotifications[0]; // Assuming sorted by desc created
      // Check if it's unread and recent enough or just rely on 'isRead'
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
          // Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          // if the response arrives synchronously or too fast during initialization.
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
