import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly baseUrl = `${environment.apiBaseUrl}/Booking`;

  constructor(private http: HttpClient) {}

  acceptBooking(rideRequestId: string, sessionId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/accept/${rideRequestId}/${sessionId}`, {}
    );
  }

  verifyPin(bookingId: string, rideRequestId: string, pin: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verifypin/${bookingId}`, { pin }, { responseType: 'text' as 'json' });
  }

  completeBooking(bookingId: string, rideRequestId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/complete/${bookingId}`, {});
  }
}