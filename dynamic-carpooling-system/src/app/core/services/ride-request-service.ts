import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class RideRequestService {
  private readonly baseUrl = `${environment.apiBaseUrl}/RideRequest`;

  constructor(private http: HttpClient) { }

  createRide(
    pickup: any,
    destination: any
  ): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create`, {
      pickup: {
        name: pickup.name,
        latitude: pickup.latitude,
        longitude: pickup.longitude
      },
      destination: {
        name: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude
      }
    })
  }

  respondToRequest(
    requestId: string,
    status: 'Accepted' | 'Rejected'
  ): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${requestId}`, {
      rideRequestStatus: status
    });
  }

  cancelRide(rideRequestId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/cancel/${rideRequestId}`, {});
  }
}