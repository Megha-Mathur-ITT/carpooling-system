import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {

  private readonly baseUrl = `${environment.apiBaseUrl}/location`;
  private watchId: number | null = null;
  private lastLat: number | null = null;
  private lastLng: number | null = null;
  private readonly MIN_DISTANCE_METERS = 10;
  private readonly MAX_INTERVAL_MS = 10000;
  private lastSentTime: number = 0;

  constructor(private http: HttpClient) { }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.lastLat = null;
      this.lastLng = null;
    }
  }

  getNearbyDrivers(
    latitude: number,
    longitude: number,
    destinationLatitude: number,
    destinationLongitude: number,
    radiusMeters: number = 2000
  ): Observable<any> {
    const params = new HttpParams()
      .set('latitude', latitude)
      .set('longitude', longitude)
      .set('destinationLatitude', destinationLatitude)
      .set('destinationLongitude', destinationLongitude)
      .set('radius', radiusMeters);

    return this.http.get<any>(`${this.baseUrl}/nearbyDrivers`, { params });
  }

  updateLocation(latitude: number, lng: number): void {
    this.http.put(`${this.baseUrl}/update`, { latitude: latitude, longitude: lng })
      .subscribe({
        error: (err: any) => console.error('[Location] Failed to send:', err)
      });
  }
}