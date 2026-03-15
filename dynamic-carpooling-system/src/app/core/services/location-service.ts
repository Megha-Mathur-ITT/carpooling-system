import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly baseUrl = `${environment.apiBaseUrl}/location`;

  constructor(private http: HttpClient) {

  }

  getNearbyDrivers(latitude: number, longitude: number, radiusMeters: number = 2000): Observable<any> {
    const params = new HttpParams()
      .set('latitude', latitude)
      .set('longitude', longitude)
      .set('radius', radiusMeters);

    // return this.http.get<any>(`${this.baseUrl}/nearbyDrivers`, { params });

    return of({
      drivers: [
        {
          driverId: 'mock-driver-1',
          driverName: 'Rahul Sharma',
          vehicleName: 'Maruti Swift',
          licensePlate: 'RJ14-AB-1234',
          availableSeats: 3,
          distanceKm: 0.8,
          latitude: latitude + 0.005,
          longitude: longitude + 0.005,
        },
        {
          driverId: 'mock-driver-2',
          driverName: 'Amit Kumar',
          vehicleName: 'Honda City',
          licensePlate: 'RJ14-CD-5678',
          availableSeats: 2,
          distanceKm: 1.4,
          latitude: latitude + 0.010,
          longitude: longitude - 0.005,
        }
      ]
    })
  }
}
