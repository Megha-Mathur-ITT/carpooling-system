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

  startTracking(initialLat?: number, initialLng?: number): void {
    if (!navigator.geolocation) {
      console.warn('[Location] Geolocation not supported.');
      return;
    }

    if (initialLat && initialLng) {
      this.lastLat = initialLat;
      this.lastLng = initialLng;
      this.lastSentTime = Date.now();
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const now = Date.now();
        const moved = this.hasMovedEnough(latitude, longitude);

        if (moved) {
          this.sendLocation(latitude, longitude);
          this.lastLat = latitude;
          this.lastLng = longitude;
          this.lastSentTime = now;
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          console.warn('[Location] Permission denied.');
          alert('Please allow location access to go online as a driver.');
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    console.log('[Location] Tracking started.');
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.lastLat = null;
      this.lastLng = null;
      console.log('[Location] Tracking stopped.');
    }
  }

  private sendLocation(lat: number, lng: number): void {
    this.http.put(`${this.baseUrl}/update`, { latitude: lat, longitude: lng })
      .subscribe({
        error: (err: any) => console.error('[Location] Failed to send:', err)
      });
  }

  private hasMovedEnough(lat: number, lng: number): boolean {
    if (this.lastLat === null || this.lastLng === null) return true;
    return this.calculateDistance(this.lastLat, this.lastLng, lat, lng)
      >= this.MIN_DISTANCE_METERS;
  }

  private calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  getNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusMeters: number = 2000
  ): Observable<any> {
    const params = new HttpParams()
      .set('latitude', latitude)
      .set('longitude', longitude)
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