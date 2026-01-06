import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { AuthResponseDto, LoginRequest, RegisterRequest, UserDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/Auth';
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('🔧 AuthService initialized');
    this.loadCurrentUser();
  }

  login(credentials: LoginRequest): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/login`, credentials)
      .pipe(tap(response => {
        if (response.success && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      }));
  }

  register(userData: RegisterRequest): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/register`, userData)
      .pipe(tap(response => {
        if (response.success && isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      }));
  }

 // Receptionist can register a new user (using in Walk-in Bookings)
  registerGuest(userData: RegisterRequest): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.roles?.includes(role) || false;
  }

  getCurrentUser(): UserDto | null {
    return this.currentUserSubject.value;
  }

  private loadCurrentUser(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      console.log('👤 Loading user from localStorage:', { hasUser: !!userStr, hasToken: !!token });

      if (userStr && this.isAuthenticated()) {
        const user = JSON.parse(userStr);
        console.log('✅ User loaded successfully:', user.email, 'Roles:', user.roles);
        this.currentUserSubject.next(user);
      } else {
        console.log('No valid user/token found');
      }
    } else {
      console.log('Running on server, skipping user load');
    }
  }
}
