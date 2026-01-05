import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResult, UserDetailsDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) { }

  getAllUsers(page: number = 1, pageSize: number = 10, role?: string): Observable<ApiResponse<PagedResult<UserDetailsDto>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (role) {
      params = params.set('role', role);
    }

    return this.http.get<ApiResponse<PagedResult<UserDetailsDto>>>(this.apiUrl, { params });
  }

  getUser(userId: string): Observable<ApiResponse<UserDetailsDto>> {
    return this.http.get<ApiResponse<UserDetailsDto>>(`${this.apiUrl}/${userId}`);
  }

  updateUser(userId: string, data: Partial<UserDetailsDto>): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${userId}`, data);
  }

  deleteUser(userId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${userId}`);
  }

  assignHotel(userId: string, hotelId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/assign-hotel`, { userId, hotelId });
  }

  getGuests(page: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<UserDetailsDto>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<ApiResponse<PagedResult<UserDetailsDto>>>(`${this.apiUrl}/guests`, { params });
  }

  getStaff(page: number = 1, pageSize: number = 10): Observable<ApiResponse<PagedResult<UserDetailsDto>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<ApiResponse<PagedResult<UserDetailsDto>>>(`${this.apiUrl}/staff`, { params });
  }

  // promoteUser(userId: string, roles: string[]): Observable<ApiResponse<void>> {
  //   return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${userId}/promote`, { roles });
  // }
  promoteUser(userId: string, roles: string[]): Observable<ApiResponse<void>> {
    // The backend expects an object that matches UpdateUserRoleDto
    const payload = {
      userId: userId,
      roles: roles
    };
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${userId}/promote`, payload);
  }

  getNotifications(userId: string): Observable<ApiResponse<import('../models').NotificationDto[]>> {
    return this.http.get<ApiResponse<import('../models').NotificationDto[]>>(`${this.apiUrl}/${userId}/notifications`);
  }

  markNotificationAsRead(userId: string, notificationId: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${userId}/notifications/${notificationId}/read`, {});
  }
}
