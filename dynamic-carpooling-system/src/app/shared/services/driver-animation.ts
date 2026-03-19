import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DriverAnimation {
  private map: any = null;
  private L: any = null;
  private carMarker: any = null;
  private passengerMarker: any = null;
  private greenPolyline: any = null;
  private bluePolyline: any = null;
  private coords: { latitude: number; longitude: number }[] = [];
  private interval: any = null;
  private hasDriverReached = false;
  private pickupIconUrl: string = '';
  private destinationIconUrl: string = '';


  init(map: any, L: any, pickupIconUrl: string, destinationIconUrl: string): void {
    this.map = map;
    this.L = L;
    this.pickupIconUrl = pickupIconUrl;
    this.destinationIconUrl = destinationIconUrl
  }

  private async fetchRoute(
    driverLatitude: number,
    driverLongitude: number,
    passengerPickupLatitude: number,
    passengerPickupLongitude: number
  ): Promise<{ latitude: number, longitude: number }[] | null> {
    const url = `https://router.project-osrm.org/route/v1/driving/${driverLongitude},${driverLatitude};${passengerPickupLongitude},${passengerPickupLatitude}?overview=full&geometries=geojson`;

    try {
      const result = await fetch(url);

      if (!result.ok) {
        return null;
      }

      const data = await result.json();
      const routeCoords = data.routes?.[0]?.geometry?.coordinates;

      if (!routeCoords || routeCoords.length < 2) {
        return null;
      }

      return routeCoords.map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0]
      }));
    } catch (error) {
      return null;
    }
  }

  private drawGreenPolyline(): void {
    this.greenPolyline = this.L.polyline(this.coords.map(coord => [coord.latitude, coord.longitude]), {
      color: '#22c55e',
      weight: 6,
      opacity: 1,
      dashArray: '10, 6'
    }).addTo(this.map);
  }

  private drawBluePolyline(
    blueCoords: {
      latitude: number,
      longitude: number
    }[]): void {
    this.bluePolyline = this.L.polyline(blueCoords.map(coord => [coord.latitude, coord.longitude]), {
      color: '#0074D9',
      weight: 5,
      opacity: 0.85,
    }).addTo(this.map);
  }

  private makePassengerIcon(): any {
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
        border:2px solid black; 
        box-shadow:0 2px 6px rgba(0,0,0,0.3);">
        &#128100;
      </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  private makeCarIcon(): any {
    const carIcon = this.L.divIcon({
      html: `<div style="
        background: white;
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid #39d353;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        &#128663;
    </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });

    return carIcon;
  }

  private placePassengerMarker(latitude: number, longitude: number): void {
    this.passengerMarker = this.L.marker(
      [latitude, longitude],
      {
        icon: this.makePassengerIcon(),
        zIndexOffset: 1500
      }
    ).addTo(this.map).bindPopup('Passenger waiting here');
  }

  private placeCarMarker(): void {
    const carIcon = this.makeCarIcon();

    this.carMarker = this.L.marker(
      [
        this.coords[0].latitude,
        this.coords[0].longitude
      ],
      {
        icon: carIcon,
        zIndexOffset: 2000
      }
    ).addTo(this.map);
  }

  private startMoving(passengerPickupLatitude: number, passengerPickupLongitude: number): void {
    this.interval = setInterval(() => {
      if (this.coords.length <= 1) {
        this.onDriverReached(passengerPickupLatitude, passengerPickupLongitude);
        clearInterval(this.interval);
        this.hasDriverReached = true;

        return;
      }

      this.coords.shift();

      const next = this.coords[0];
      this.carMarker?.setLatLng([next.latitude, next.longitude]);

      this.greenPolyline?.setLatLngs(this.coords.map(coord => [coord.latitude, coord.longitude]));
    }, 1000);
  }

  private makePickupIcon(passengerPickupLatitude: number, passengerPickupLongitude: number) {
    const pickupIcon = this.L.icon({
      iconUrl: this.pickupIconUrl,
      shadowUrl: 'assets/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.L.marker(
      [passengerPickupLatitude, passengerPickupLongitude],
      { icon: pickupIcon, title: 'Pickup', zIndexOffset: 500 }
    ).addTo(this.map).bindPopup('<b>Driver has arrived!</b>');

    return pickupIcon;
  }

  private makeDestinationIcon() {
    const destinationCoords = this.bluePolyline?.getLatLngs();

    if (destinationCoords?.length > 0) {
      const last = destinationCoords[destinationCoords.length - 1];

      const destinationIcon = this.L.icon({
        iconUrl: this.destinationIconUrl,
        shadowUrl: 'assets/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      this.L.marker(
        [last.lat, last.lng],
        { icon: destinationIcon, title: 'Destination', zIndexOffset: 500 }
      ).addTo(this.map).bindPopup('<b>Destination</b>');

      return destinationIcon;
    }
  }

  private onDriverReached(passengerPickupLatitude: number, passengerPickupLongitude: number) {
    this.carMarker.setLatLng([passengerPickupLatitude, passengerPickupLongitude]);

    if (this.greenPolyline) {
      this.map.removeLayer(this.greenPolyline);
      this.greenPolyline = null;
    }

    if (this.map) {
      this.map.eachLayer((layer: any) => {
        if (layer.options?.title == "Pickup") {
          this.map.removeLayer(layer);
        }
      })
    }

    const pickupIcon = this.makePickupIcon(passengerPickupLatitude, passengerPickupLongitude);
    const destinationIcon = this.makeDestinationIcon();

    if (this.passengerMarker) {
      this.map.removeLayer(this.passengerMarker);
      this.passengerMarker = null;
    }

    if (this.bluePolyline) {
      this.map.fitBounds(this.bluePolyline.getBounds(), { padding: [60, 60] });
    }
  }

  async startAnimation(
    driverLatitude: number,
    driverLongitude: number,
    passengerPickupLatitude: number,
    passengerPickupLongitude: number,
    passengerDestinationLatitude: number,
    passengerDestinationLongitude: number
  ): Promise<void> {
    if (!this.map || !this.L) {
      return;
    }

    if (!driverLatitude || !driverLongitude || !passengerPickupLatitude || !passengerPickupLongitude) {
      return;
    }

    this.stop();
    this.hasDriverReached = false;

    const driverToPassenger = await this.fetchRoute(
      driverLatitude, driverLongitude,
      passengerPickupLatitude, passengerPickupLongitude
    );

    const passengerToDestination = await this.fetchRoute(
      passengerPickupLatitude, passengerPickupLongitude,
      passengerDestinationLatitude, passengerDestinationLongitude
    );

    if (!driverToPassenger) {
      return;
    }

    this.coords = driverToPassenger;
    this.drawGreenPolyline();

    if (!passengerToDestination) {
      return;
    }

    this.drawBluePolyline(passengerToDestination);
    const allCoords = [...driverToPassenger, ...passengerToDestination];

    const bounds = this.L.latLngBounds(allCoords.map(coords => [coords.latitude, coords.longitude]));
    this.map.fitBounds(bounds, {
      padding: [60, 60]
    });

    this.placePassengerMarker(passengerPickupLatitude, passengerPickupLongitude);
    this.placeCarMarker();
    this.startMoving(passengerPickupLatitude, passengerPickupLongitude);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.carMarker && this.map) {
      this.map.removeLayer(this.carMarker);
      this.carMarker = null;
    }

    if (this.passengerMarker && this.map) {
      this.map.removeLayer(this.passengerMarker);
      this.passengerMarker = null;
    }

    if (this.greenPolyline && this.map) {
      this.map.removeLayer(this.greenPolyline);
      this.greenPolyline = null;
    }

    if (this.bluePolyline && this.map) {
      this.map.removeLayer(this.bluePolyline);
      this.bluePolyline = null;
    }

    this.coords = [];
    this.hasDriverReached = false;
  }
}