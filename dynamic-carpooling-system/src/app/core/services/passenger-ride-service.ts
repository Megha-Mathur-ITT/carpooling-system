import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class PassengerRideService {
  pickup: any = null;
  destination: any = null;
  rideRequestId: string | null = null;
  selectedDriver: any = null;

  city: string = '';
  state: string = '';
  passengerName: string = '';

  distanceKm: number = 0;
  durationMin: number = 0;
  fare: number = 0;
  pin: string = '';
  bookingId: string = '';
  passengerId: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(platformId)) {
      this.loadFromStorage();
    }
  }

  setPickup(pickup: any) {
    this.pickup = pickup;

    if (this.isBrowser()) {
      if (pickup) {
        sessionStorage.setItem("pickup", JSON.stringify(pickup));
      }
      else {
        sessionStorage.removeItem("pickup");
      }
    }
  }

  setDestination(destination: any) {
    this.destination = destination;

    if (this.isBrowser()) {
      if (destination) {
        sessionStorage.setItem("destination", JSON.stringify(destination));
      }
      else {
        sessionStorage.removeItem("destination");
      }
    }
  }

  setCity(city: string) {
    this.city = city;

    if (this.isBrowser()) {
      sessionStorage.setItem('city', city);
    }
  }

  setState(state: string) {
    this.state = state;

    if (this.isBrowser()) {
      sessionStorage.setItem('state', state);
    }
  }

  setRideRequestId(requestId: string | null) {
    this.rideRequestId = requestId;

    if (this.isBrowser()) {
      if (requestId) {
        sessionStorage.setItem("rideRequestId", requestId);
      }
      else {
        sessionStorage.removeItem("rideRequestId");
      }
    }
  }

  setSelectedDriver(driver: any) {
    this.selectedDriver = driver;

    if (this.isBrowser()) {
      if (driver) {
        sessionStorage.setItem('selectedDriver', JSON.stringify(driver));
      } else {
        sessionStorage.removeItem('selectedDriver');
      }
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  setRouteInfo(distanceKm: number, durationMin: number): void {
    this.distanceKm = distanceKm;
    this.durationMin = durationMin;
    this.fare = Math.round(distanceKm * 9);
  }

  setBookingResult(fare: number, pin: string): void {
    this.fare = fare;
    this.pin = pin;
  }

  setPassengerId(id: string): void {
    this.passengerId = id;

    if (this.isBrowser()) {
      if (id) {
        sessionStorage.setItem('passengerId', id);
      } else {
        sessionStorage.removeItem('passengerId');
      }
    }
  }

  loadFromStorage() {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const pickupPoint = sessionStorage.getItem("pickup");
      const destinationPoint = sessionStorage.getItem("destination");
      this.pickup = pickupPoint ? JSON.parse(pickupPoint) : null;
      this.destination = destinationPoint ? JSON.parse(destinationPoint) : null;
      this.city = sessionStorage.getItem('city') || '';
      this.state = sessionStorage.getItem('state') || '';
      this.rideRequestId = sessionStorage.getItem("rideRequestId") || null;
      this.selectedDriver = JSON.parse(sessionStorage.getItem("selectedDriver") || "null");
      this.passengerId = sessionStorage.getItem('passengerId') || '';
    } catch {
      sessionStorage.removeItem("pickup");
      sessionStorage.removeItem("destination");
      sessionStorage.removeItem("city");
      sessionStorage.removeItem("state");
      sessionStorage.removeItem("rideRequestId");

      this.pickup = null;
      this.destination = null;
      this.city = '';
      this.state = '';
      this.rideRequestId = null;
      this.passengerId = ''; 
    }
  }
}