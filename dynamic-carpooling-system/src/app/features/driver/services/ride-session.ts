import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { tap } from 'rxjs';
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
  private passengerNameCache = new Map<string, string>();

  constructor(private http: HttpClient) { }
  isOnline$ = new BehaviorSubject<boolean>(false);
  refreshPassengers$ = new Subject<void>();
  currentSessionId: string | null = null;

  getMyVehicle(): Observable<any> {
    return this.http.get(`${this.vehicleUrl}/mine`);
  }

  startSession(dto: StartSessionDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/start`, dto).pipe(
      tap((res: any) => {
        this.currentSessionId = res.rideId ?? res.sessionId ?? null;
        console.log('[RideSession] currentSessionId set to:', this.currentSessionId);
      })
    );
  }

  stopSession(): Observable<any> {
    return this.http.post(`${this.baseUrl}/stop`, {}).pipe(
      tap(() => { this.currentSessionId = null; })
    );
  }

  cachePassengerName(sessionId: string, name: string): void {
    if (sessionId && name && name.trim()) {
      this.passengerNameCache.set(sessionId, name.trim());
    }
  }

  getPassengerName(sessionId: string): string | null {
    return this.passengerNameCache.get(sessionId) ?? null;
  }
}