import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import {Observable} from 'rxjs';
import {Observable, of} from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RideRequestService {
  private readonly baseUrl = `${environment.apiBaseUrl}/ride`;

  constructor(private http: HttpClient) {
    
  }

  createRide(pickup: any, destination: any): Observable<any> {

    // return this.http.post<any>(`${this.baseUrl}/create`, {
    //   pickup: pickup,
    //   destination: destination,
    // })

    // Mock - data
    return of ({
      rideRequestId: 'mock-rideRequestId-1234',
      status: 'searching'
    })
  }
}
