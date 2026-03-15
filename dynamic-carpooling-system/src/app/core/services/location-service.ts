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

    return this.http.get<any>(`${this.baseUrl}/nearbyDrivers`, { params });
  }
}
