import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/environments/environment';

export interface LocationDto {
  latitude: number;
  longitude: number;
  name: string;
}

export interface StartSessionDto {
  vehicleId: string;
  pickup: LocationDto;
  destination: LocationDto;
  availableSeats?: number;
}

export interface RideRequest {
  requestId: string;
  passengerId: string;
  passengerName: string;
  pickup: LocationDto;
  destination: LocationDto;
  requestedAt?: string;
  rideRequestStatus?: string;
  sessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class RideSessionService {
  private readonly baseUrl = `${environment.apiBaseUrl}/RideSession`;
  private readonly vehicleUrl = `${environment.apiBaseUrl}/Vehicle`;

  constructor(private http: HttpClient) { }

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