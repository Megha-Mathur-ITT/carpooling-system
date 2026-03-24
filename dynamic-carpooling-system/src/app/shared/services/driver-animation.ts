import { Injectable } from '@angular/core';
import { Location } from '../../core/models/auth-model'

@Injectable({ providedIn: 'root' })
export class DriverAnimation {
  private map: any = null;
  private L: any = null;
  private carMarker: any = null;
  private passengerMarker: any = null;
  private greenPolyline: any = null;
  private bluePolyline: any = null;
  private coords: Location[] = [];
  private destinationCoords: Location[] = [];
  private pickupIconUrl: string = '';
  private destinationIconUrl: string = '';
  private reachedCallback: (() => void) | null = null;
  private interval: any = null;
  private hasDriverReached = false;
  private passengerPickupAddress: string = '';
  private passengerDestinationAddress: string = '';

  init(map: any, L: any, pickupIconUrl: string, destinationIconUrl: string): void {
    this.map = map;
    this.L = L;
    this.pickupIconUrl = pickupIconUrl;
    this.destinationIconUrl = destinationIconUrl;
  }

  onDriverReachedPickup(cb: () => void): void {
    this.reachedCallback = cb;
  }

  private buildRouteUrl(pickup: Location, destination: Location) {
    return `https://router.project-osrm.org/route/v1/driving/${pickup.longitude},${pickup.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
  }

  private parseRouteCoords(data: any): Location[] | null {
    const routeCoords = data.routes?.[0]?.geometry?.coordinates;

    if (!routeCoords || routeCoords.length < 2) {
      return null;
    }

    return routeCoords.map((coord: number[]) => ({
      latitude: coord[1],
      longitude: coord[0]
    }));
  }

  private async fetchRoute(pickup: Location, destination: Location): Promise<Location[] | null> {
    const url = this.buildRouteUrl(pickup, destination);

    try {
      const result = await fetch(url);

      if (!result.ok) {
        return null;
      }

      return this.parseRouteCoords(await result.json());
    } catch (error) {
      return null;
    }
  }

  private isReady(driver: Location, passengerPickup: Location): boolean {
    if (!this.map || !this.L ||
      driver.latitude == null || driver.longitude == null ||
      !passengerPickup.latitude || !passengerPickup.longitude) {
      return false;
    }

    return true;
  }

  private setupRoute(route: Location[]) {
    this.coords = [...route];
    this.greenPolyline = this.drawPolyline(route, "green", true);
  }

  private setupDestinationRoute(destinationCoords: Location[]) {
    this.destinationCoords = [...destinationCoords];
    this.bluePolyline = this.drawPolyline(destinationCoords, "blue", false);
  }

  private fitMapToRoute(
    driverToPassenger: Location[],
    passengerToDestination: Location[],
  ) {
    const allCoords = [...driverToPassenger, ...passengerToDestination];

    const bounds = this.L.latLngBounds(allCoords.map(coords => [coords.latitude, coords.longitude]));
    this.map.fitBounds(bounds, {
      padding: [60, 60]
    });
  }

  private placeInitialMarkers(passengerPickup: Location) {
    this.passengerMarker = this.placeMarker(
      passengerPickup,
      this.makeDivIcon("black", "&#128100"),
      1500,
      `<b>Passenger Pickup point:</b> <br> ${this.passengerPickupAddress}`
    );

    if (this.coords.length > 0) {
      this.carMarker =
        this.placeMarker(
          this.coords[0],
          this.makeDivIcon('#39d353', '&#128663;'),
          2000,
          "Driver"
        );
    }
  }

  private animateAlongRoute(
    coords: { latitude: number; longitude: number }[],
    polyline: any,
    onComplete: () => void
  ): any {
    return setInterval(() => {
      if (coords.length <= 1) {
        clearInterval(this.interval);
        onComplete();

        return;
      }

      coords.shift()
      const next = coords[0];

      if (!next) {
        return;
      }

      this.carMarker?.setLatLng([next.latitude, next.longitude]);
      polyline?.setLatLngs(coords.map(c => [c.latitude, c.longitude]));
    }, 1000);
  }

  private startMoving(passengerPickup: Location, onDriverArrived?: () => void): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = this.animateAlongRoute(
      this.coords,
      this.greenPolyline,
      () => {
        this.onDriverReached(passengerPickup);
        this.hasDriverReached = true;
        onDriverArrived?.();
      }
    );
  }

  private drawPolyline(coords: Location[], color: string, isDashed: boolean = false): any {
    return this.L.polyline(coords.map(coord => [coord.latitude, coord.longitude]), {
      color,
      weight: 6,
      opacity: 1,
      ...(isDashed && { dashArray: '10, 6' })
    }).addTo(this.map);
  }

  private placeMarker(location: Location, icon: any, zIndexOffset: number, popupText?: string) {
    const marker = this.L.marker(
      [location.latitude, location.longitude],
      { icon, zIndexOffset, }
    )
      .addTo(this.map).bindPopup(popupText);

    return marker;
  }

  private makeDivIcon(borderColor: string, emoji: string) {
    return this.L.divIcon({
      html: `<div style="
        background:white; 
        color:white; 
        border-radius:50%;
        width:32px; 
        height:32px; 
        display:flex; 
        align-items:center;
        justify-content:center; 
        font-size:16px;
        border:2px solid ${borderColor}; 
        box-shadow:0 2px 6px rgba(0,0,0,0.3);">
        ${emoji};
      </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  private makeLIcon(iconUrl: string): any {
    return this.L.icon({
      iconUrl,
      shadowUrl: 'assets/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  public onDriverReached(passengerPickup: Location) {
    this.carMarker.setLatLng([passengerPickup.latitude, passengerPickup.longitude]);

    if (this.greenPolyline) {
      this.map.removeLayer(this.greenPolyline);
      this.greenPolyline = null;
    }

    if (this.map) {
      this.map.eachLayer((layer: any) => {
        if (layer.options?.title == "Pickup") {
          this.map.removeLayer(layer);
        }
      });
    }

    this.makeLIcon(this.pickupIconUrl);
    this.makeLIcon(this.destinationIconUrl);

    if (this.passengerMarker) {
      this.map.removeLayer(this.passengerMarker);
      this.passengerMarker = null;
    }

    if (this.bluePolyline) {
      this.map.fitBounds(this.bluePolyline.getBounds(), { padding: [60, 60] });
    }

    console.log('DRIVER REACHED METHOD CALLED');
    this.reachedCallback?.();
  }

  public async startDestinationAnimation(
    passengerPickup: Location,
    passengerDestination: Location,
    driverLocation: Location,
    onReachedDestination?: () => void) {
    if (!this.destinationCoords || this.destinationCoords.length < 2) {
      return;
    }

    this.stop();
    this.hasDriverReached = false;

    const driverToPassenger = await this.fetchRoute(driverLocation, passengerPickup);

    const passengerToDestination = await this.fetchRoute(passengerPickup, passengerDestination);

    if (!driverToPassenger) {
      return;
    }

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = this.animateAlongRoute([...this.destinationCoords], this.bluePolyline, () => {
      onReachedDestination?.();
    });
  }
 
  private removeLayer(layer: any): null {
    if (layer && this.map) {
      this.map.removeLayer(layer);
    }

    return null;
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.carMarker = this.removeLayer(this.carMarker);
    this.passengerMarker = this.removeLayer(this.passengerMarker);
    this.greenPolyline = this.removeLayer(this.greenPolyline);
    this.bluePolyline = this.removeLayer(this.bluePolyline);

    this.coords = [];
    this.destinationCoords = [];
    this.hasDriverReached = false;
  }

  async startAnimation(
    driver: Location,
    passengerPickup: Location,
    passengerDestination: Location,
    passengerPickupAddress: string,
    passengerDestinationAddress: string,
    onDriverArrived?: () => void,
  ): Promise<void> {
    if (!this.isReady(driver, passengerPickup)) {
      return;
    }

    this.passengerPickupAddress = passengerPickupAddress;
    this.passengerDestinationAddress = passengerDestinationAddress;

    this.stop();
    this.hasDriverReached = false;

    const driverToPassenger = await this.fetchRoute(driver, passengerPickup);
    const passengerToDestination = await this.fetchRoute(passengerPickup, passengerDestination);

    if (!driverToPassenger || !passengerToDestination) {
      return;
    }

    this.setupRoute([...driverToPassenger]);
    this.setupDestinationRoute([...passengerToDestination]);
    this.fitMapToRoute(driverToPassenger, passengerToDestination);
    this.placeInitialMarkers(passengerPickup);
    this.startMoving(passengerPickup, onDriverArrived);
  }
}