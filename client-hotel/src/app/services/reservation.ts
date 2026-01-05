import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ReservationDto, BillDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  getReservations(): Observable<ApiResponse<ReservationDto[]>> {
    return this.http.get<ApiResponse<ReservationDto[]>>(`${this.apiUrl}/Reservations`);
  }

  getAllReservations(): Observable<ApiResponse<ReservationDto[]>> {
    return this.http.get<ApiResponse<ReservationDto[]>>(`${this.apiUrl}/Reservations/all`);
  }

  createReservation(reservation: any): Observable<ApiResponse<ReservationDto>> {
    return this.http.post<ApiResponse<ReservationDto>>(`${this.apiUrl}/Reservations`, reservation);
  }

  updateReservation(id: number, reservation: any): Observable<ApiResponse<ReservationDto>> {
    return this.http.put<ApiResponse<ReservationDto>>(`${this.apiUrl}/Reservations/${id}`, reservation);
  }

  cancelReservation(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Reservations/${id}/cancel`, {});
  }

  confirmReservation(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Reservations/${id}/confirm`, {});
  }

  checkIn(reservationId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Reservations/${reservationId}/checkin`, {});
  }

  checkOut(reservationId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Reservations/${reservationId}/checkout`, {});
  }

  getBills(): Observable<ApiResponse<BillDto[]>> {
    return this.http.get<ApiResponse<BillDto[]>>(`${this.apiUrl}/Bills`);
  }

  getBill(id: number): Observable<ApiResponse<BillDto>> {
    return this.http.get<ApiResponse<BillDto>>(`${this.apiUrl}/Bills/${id}`);
  }

  processPayment(billId: number, amount: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/Bills/${billId}/payment`, { billId, amount });
  }

  createBill(billData: any): Observable<ApiResponse<BillDto>> {
    return this.http.post<ApiResponse<BillDto>>(`${this.apiUrl}/Bills`, billData);
  }
}
