import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models'; // Ensure ApiResponse is exported or redefine

export interface SeasonalRateDto {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    multiplier: number;
    hotelId: number;
}

export interface CreateSeasonalRateDto {
    name: string;
    startDate: string;
    endDate: string;
    multiplier: number;
    hotelId: number;
}

@Injectable({
    providedIn: 'root'
})
export class SeasonalRateService {
    private apiUrl = '/api/SeasonalRates';

    constructor(private http: HttpClient) { }

    getRatesByHotel(hotelId: number): Observable<ApiResponse<SeasonalRateDto[]>> {
        return this.http.get<ApiResponse<SeasonalRateDto[]>>(`${this.apiUrl}/${hotelId}`);
    }

    createRate(data: CreateSeasonalRateDto): Observable<ApiResponse<SeasonalRateDto>> {
        return this.http.post<ApiResponse<SeasonalRateDto>>(this.apiUrl, data);
    }

    deleteRate(id: number): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
    }
}
