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
      if(pickup) {
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
      if(destination) {
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

  loadFromStorage() {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const pickupStr = sessionStorage.getItem("pickup");
      const destinationStr = sessionStorage.getItem("destination");

      this.pickup = pickupStr ? JSON.parse(pickupStr) : null;
      this.destination = destinationStr ? JSON.parse(destinationStr) : null;

      this.city = sessionStorage.getItem('city') || '';
      this.state = sessionStorage.getItem('state') || '';
    } catch {
      sessionStorage.removeItem("pickup");
      sessionStorage.removeItem("destination");
      sessionStorage.removeItem("city");
      sessionStorage.removeItem("state");

      this.pickup = null;
      this.destination = null;
      this.city = '';
      this.state = '';
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
