import { Injectable } from '@angular/core';
import { SelectedLocation } from '../../../shared/components/location-search/location-search';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DriverRideService {
  private platformId = inject(PLATFORM_ID);

  getPickup(): SelectedLocation | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const data = sessionStorage.getItem('pickup');
    return data ? JSON.parse(data) : null;
  }

  setPickup(location: SelectedLocation): void {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.setItem('pickup', JSON.stringify(location));
  }

  getDestination(): SelectedLocation | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const data = sessionStorage.getItem('destination');
    return data ? JSON.parse(data) : null;
  }

  setDestination(location: SelectedLocation): void {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.setItem('destination', JSON.stringify(location));
  }

  getIsOnline(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return sessionStorage.getItem('isOnline') === 'true';
  }

  setIsOnline(status: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.setItem('isOnline', status ? 'true' : 'false');
  }

  getSeatCount(): number {
    if (!isPlatformBrowser(this.platformId)) return 4;
    return parseInt(sessionStorage.getItem('seatCount') ?? '4', 10);
  }

  setSeatCount(count: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.setItem('seatCount', count.toString());
  }

  getDistanceKm(): number {
    if (!isPlatformBrowser(this.platformId)) return 0;
    return parseFloat(sessionStorage.getItem('distanceKm') ?? '0');
  }

  setDistanceKm(value: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.setItem('distanceKm', value.toString());
  }

  getFare(): number {
    if (!isPlatformBrowser(this.platformId)) return 0;
    return parseFloat(sessionStorage.getItem('driverFare') ?? '0');
  }

  setFare(value: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.setItem('driverFare', value.toString());
  }

  getActiveRide(): any {
    if (!isPlatformBrowser(this.platformId)) return null;
    const data = sessionStorage.getItem('driver_active_ride');
    return data ? JSON.parse(data) : null;
  }

  setActiveRide(ride: any): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (ride) {
      sessionStorage.setItem('driver_active_ride', JSON.stringify(ride));
    } else {
      sessionStorage.removeItem('driver_active_ride');
    }
  }

  getActiveRides(): any[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const data = sessionStorage.getItem('driver_active_rides');
    return data ? JSON.parse(data) : [];
  }

  addActiveRide(ride: any): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const rides = this.getActiveRides();
    rides.push(ride);
    sessionStorage.setItem('driver_active_rides', JSON.stringify(rides));
  }

  clearAll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    sessionStorage.removeItem('pickup');
    sessionStorage.removeItem('destination');
    sessionStorage.removeItem('isOnline');
    sessionStorage.removeItem('seatCount');
    sessionStorage.removeItem('driver_active_ride');
    sessionStorage.removeItem('driver_payment_pending');
    sessionStorage.removeItem('driver_ride_completed');
    sessionStorage.removeItem('distanceKm');
    sessionStorage.removeItem('driverFare');
    sessionStorage.removeItem('rideRequestId');
    sessionStorage.removeItem('selectedDriver');
    sessionStorage.removeItem('passengerId');
    sessionStorage.removeItem('bookingId');
    sessionStorage.removeItem('city');
    sessionStorage.removeItem('state');
    sessionStorage.removeItem('fare');
    sessionStorage.removeItem('durationMin');
    sessionStorage.removeItem('pin');
  }
}
