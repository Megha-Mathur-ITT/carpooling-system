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
    const body: RideRequestCreateDto = {
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
    }

    return this.http.post<any>(`${this.baseUrl}/create`, body);
  }

  respondToRequest(
    requestId: string,
    status: 'Accepted' | 'Rejected'
  ): Observable<any> {
    console.log("update req status: ", status);
    const statusMap: Record<string, number> = {
      'Accepted': 2,
      'Rejected': 3
    };

    return this.http.put(`${this.baseUrl}/update/${requestId}`, {
      rideRequestStatus: statusMap[status]
    });
  }

  // notifyDriver(requestId: string, driverId: string): Observable<any> {
  //   return this.http.post(
  //     `${this.baseUrl}/${requestId}/notify-driver/${driverId}`, {}
  //   );
  // }
}