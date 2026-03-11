import { Injectable } from '@angular/core';
import { environment } from '../../core/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { reverseGeoCodeResponse } from '../../core/models/reverseGeoCodeResponse-model';

@Injectable({
  providedIn: 'root',
})
export class LocationTrackingService {
  private readonly baseUrl = `${environment.apiBaseUrl}/location`;

  constructor(private http: HttpClient) {

  }

  getLocationFromCoordinates(latitude: number, longitude: number): Observable<reverseGeoCodeResponse> {
    const params = new HttpParams()
      .set('latitude', latitude)
      .set('longitude', longitude);

    return this.http.get<reverseGeoCodeResponse>(
      `${this.baseUrl}/location`,
      { params }
    );
  }
}
