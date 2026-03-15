import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/environments/environment';

export interface StartSessionDto {
  vehicleId: string;
  pickup: string;
  dropoff: string;
  availableSeats?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RideSessionService {
  private readonly baseUrl = `${environment.apiBaseUrl}/RideSession`;
  private readonly vehicleUrl = `${environment.apiBaseUrl}/Vehicle`;

  constructor(private http: HttpClient) {}

  getMyVehicle(): Observable<any> {
    return this.http.get(`${this.vehicleUrl}/mine`);
  }

  startSession(dto: StartSessionDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/start`, dto);
  }

  stopSession(): Observable<any> {
    return this.http.post(`${this.baseUrl}/stop`, {});
  }
}