import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, HotelDto, RoomDto } from '../models';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  getHotels(): Observable<ApiResponse<HotelDto[]>> {
    return this.http.get<ApiResponse<HotelDto[]>>(`${this.apiUrl}/Hotels`);
  }

  getHotel(id: number): Observable<ApiResponse<HotelDto>> {
    return this.http.get<ApiResponse<HotelDto>>(`${this.apiUrl}/Hotels/${id}`);
  }

  createHotel(hotel: Partial<HotelDto>): Observable<ApiResponse<HotelDto>> {
    return this.http.post<ApiResponse<HotelDto>>(`${this.apiUrl}/Hotels`, hotel);
  }

  updateHotel(id: number, hotel: Partial<HotelDto>): Observable<ApiResponse<HotelDto>> {
    return this.http.put<ApiResponse<HotelDto>>(`${this.apiUrl}/Hotels/${id}`, hotel);
  }

  deleteHotel(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/Hotels/${id}`);
  }

  getRooms(): Observable<ApiResponse<RoomDto[]>> {
    return this.http.get<ApiResponse<RoomDto[]>>(`${this.apiUrl}/Rooms`);
  }

  getRoomsByHotel(hotelId: number): Observable<ApiResponse<RoomDto[]>> {
    return this.http.get<ApiResponse<RoomDto[]>>(`${this.apiUrl}/Rooms?hotelId=${hotelId}`);
  }

  getAvailableRooms(checkIn: string, checkOut: string, hotelId: number) {
  const params = new HttpParams()
    .set('checkIn', checkIn)
    .set('checkOut', checkOut)
    .set('hotelId', hotelId.toString());

  return this.http.get<ApiResponse<RoomDto[]>>(`${this.apiUrl}/Rooms/available`, { params });
}

  getRoom(id: number): Observable<ApiResponse<RoomDto>> {
    return this.http.get<ApiResponse<RoomDto>>(`${this.apiUrl}/Rooms/${id}`);
  }

  createRoom(room: Partial<RoomDto>): Observable<ApiResponse<RoomDto>> {
    return this.http.post<ApiResponse<RoomDto>>(`${this.apiUrl}/Rooms`, room);
  }

  updateRoom(id: number, room: Partial<RoomDto>): Observable<ApiResponse<RoomDto>> {
    return this.http.put<ApiResponse<RoomDto>>(`${this.apiUrl}/Rooms/${id}`, room);
  }

  deleteRoom(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/Rooms/${id}`);
  }
}