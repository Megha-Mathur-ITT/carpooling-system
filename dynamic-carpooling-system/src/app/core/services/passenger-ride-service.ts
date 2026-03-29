import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class PassengerRideService {
  pickup: any = null;
  destination: any = null;
  rideRequestId: string = '';
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

  setPassengerName(name: string) {
    this.passengerName = name;

    if (this.isBrowser()) {
      if (name) {
        sessionStorage.setItem('passengerName', name);
      } else {
        sessionStorage.removeItem('passengerName');
      }
    }
  }

  setState(state: string) {
    this.state = state;

    if (this.isBrowser()) {
      sessionStorage.setItem('state', state);
    }
  }

  setRideRequestId(requestId: string) {
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

    if (this.isBrowser()) {
      sessionStorage.setItem('distanceKm', distanceKm.toString());
      sessionStorage.setItem('durationMin', durationMin.toString());
    }
  }

  setBookingResult(fare: number, pin: string): void {
    this.fare = fare;
    this.pin = pin;

    sessionStorage.setItem('fare', fare.toString());
    sessionStorage.setItem('pin', pin);
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

  setBookingId(id: string): void {
    this.bookingId = id;

    if (this.isBrowser()) {
      if (id) {
        sessionStorage.setItem('bookingId', id);
      } else {
        sessionStorage.removeItem('bookingId');
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
      this.rideRequestId = sessionStorage.getItem("rideRequestId") || '';
      this.selectedDriver = JSON.parse(sessionStorage.getItem("selectedDriver") || "null");
      this.passengerId = sessionStorage.getItem('passengerId') || '';
      this.passengerName = sessionStorage.getItem('passengerName') || '';
      this.distanceKm = parseFloat(sessionStorage.getItem('distanceKm') || '0');
      this.durationMin = parseFloat(sessionStorage.getItem('durationMin') || '0');
      this.fare = parseFloat(sessionStorage.getItem('fare') || '0');
      this.pin = sessionStorage.getItem('pin') || '';
      this.bookingId = sessionStorage.getItem('bookingId') || '';
    } catch {
      this.clearAll();
    }
  }

  clearAll() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    sessionStorage.removeItem("pickup");
    sessionStorage.removeItem("destination");
    sessionStorage.removeItem("city");
    sessionStorage.removeItem("state");
    sessionStorage.removeItem("rideRequestId");
    sessionStorage.removeItem("selectedDriver");
    sessionStorage.removeItem("passengerId");
    sessionStorage.removeItem("passengerName");
    sessionStorage.removeItem("distanceKm");
    sessionStorage.removeItem("durationMin");
    sessionStorage.removeItem("fare");
    sessionStorage.removeItem("pin");
    sessionStorage.removeItem("bookingId");

    this.pickup = null;
    this.destination = null;
    this.city = '';
    this.state = '';
    this.rideRequestId = '';
    this.selectedDriver = null;
    this.passengerId = '';
    this.passengerName = '';
    this.distanceKm = 0;
    this.durationMin = 0;
    this.fare = 0;
    this.pin = '';
    this.bookingId = '';
  }
}
