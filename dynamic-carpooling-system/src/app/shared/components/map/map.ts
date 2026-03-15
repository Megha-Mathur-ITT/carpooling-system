import { Component, Inject, PLATFORM_ID, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrls: ['./map.scss']
})
export class MapComponent implements OnInit, OnChanges {

  map: any;
  L: any;

  pickupMarker: any;
  destinationMarker: any;
  routingControl: any;

  private pendingPickup: any = null;
  private pendingDestination: any = null;
  private mapReady = false;

  routeCoordinates: { lat: number; lng: number }[] = [];

  private defaultPickup = { latitude: 26.9124, longitude: 75.7873, name: 'Jaipur, Rajasthan, India' };

  @Input() pickup: any;
  @Input() destination: any;
  @Input() drivers: any[] = [];
  @Input() showRadiusCircle: boolean = false;

  private driverMarkers: any[] = [];
  private radiusCircle: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const leafletModule = await import('leaflet');
    this.L = (leafletModule as any).default ?? leafletModule;

    delete (this.L.Icon.Default.prototype as any)._getIconUrl;
    this.L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/images/marker-icon-2x.png',
      iconUrl: 'assets/images/marker-icon.png',
      shadowUrl: 'assets/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    (window as any).L = this.L;
    await this.loadScriptOnce(
      'leaflet-routing-machine-script',
      'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js'
    );

    const mapContainer = this.L.DomUtil.get('map');

    if (mapContainer != null) {
      mapContainer._leaflet_id = null;
    }

    this.map = this.L.map('map').setView(
      [this.defaultPickup.latitude, this.defaultPickup.longitude], 13
    );

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.map);

    this.pickupMarker = this.L.marker(
      [this.defaultPickup.latitude, this.defaultPickup.longitude],
      { icon: this.makeIcon(), title: 'Pickup' }
    ).addTo(this.map);
    this.pickupMarker.bindPopup('<b>&#128205; Pickup</b><br>Jaipur, Rajasthan').openPopup();

    this.mapReady = true;

    if (this.pendingPickup) {
      this.applyPickup(this.pendingPickup);

      if (this.showRadiusCircle) {
        this.addRadiusCircle(this.pendingPickup.latitude, this.pendingPickup.longitude);
      }

      this.pendingPickup = null;
    }

    if (this.pendingDestination) {
      this.applyDestination(this.pendingDestination);
      this.pendingDestination = null;
    }

    if (this.drivers?.length > 0) {
      this.addDriverMarkers(this.drivers);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.mapReady) {
      if (this.pickup) {
        this.pendingPickup = this.pickup;
      }

      if (this.destination) {
        this.pendingDestination = this.destination;
      }

      return;
    }

    if (changes['pickup'] && this.pickup) {
      this.applyPickup(this.pickup);

      if (this.showRadiusCircle) {
        this.addRadiusCircle(this.pickup.latitude, this.pickup.longitude);
      }
    }

    if (changes['destination'] && this.destination) {
      this.applyDestination(this.destination);
    }

    if (changes['drivers'] && this.drivers?.length > 0) {
      console.log('adding driver markers:', this.drivers);
      this.addDriverMarkers(this.drivers);

      if (this.pickup && this.showRadiusCircle) {
        this.fitToPickupArea(this.pickup.latitude, this.pickup.longitude);
      }
    }
  }

  setPickup(location: any) {
    if (!this.mapReady) {
      this.pendingPickup = location;
      return;
    }

    this.applyPickup(location);
  }

  setDestination(location: any) {
    if (!this.mapReady) {
      this.pendingDestination = location;
      return;
    }

    this.applyDestination(location);
  }

  private loadScriptOnce(id: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  private makeIcon() {
    return this.L.icon({
      iconUrl: 'assets/images/marker-icon.png',
      iconRetinaUrl: 'assets/images/marker-icon-2x.png',
      shadowUrl: 'assets/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  private applyPickup(location: any) {
    const { latitude, longitude, name } = location;

    if (this.pickupMarker) {
      this.pickupMarker.setLatLng([latitude, longitude]);
    } else {
      this.pickupMarker = this.L.marker([latitude, longitude], { icon: this.makeIcon(), title: 'Pickup' }).addTo(this.map);
    }

    this.pickupMarker.bindPopup(`<b> &#128205; Pickup</b><br>${name}`).openPopup();

    if (this.destinationMarker && !this.showRadiusCircle) {
      this.fitMapToBothMarkers();
      this.createRoute();
    }
    else if (this.destinationMarker) {
      this.createRoute();
    }
  }

  private applyDestination(location: any) {
    const { latitude, longitude, name } = location;

    if (this.destinationMarker) {
      this.destinationMarker.setLatLng([latitude, longitude]);
    } else {
      this.destinationMarker = this.L.marker([latitude, longitude], { icon: this.makeIcon(), title: 'Destination' }).addTo(this.map);
    }

    this.destinationMarker.bindPopup(`<b> &#127937; Destination</b><br>${name}`).openPopup();

    if (!this.showRadiusCircle) {
      this.fitMapToBothMarkers();
    }

    this.createRoute();
  }

  private fitMapToBothMarkers() {
    if (this.pickupMarker && this.destinationMarker) {
      this.map.fitBounds(
        this.L.latLngBounds([
          this.pickupMarker.getLatLng(),
          this.destinationMarker.getLatLng()
        ]),
        { padding: [60, 60] }
      );
    }
  }

  createRoute() {
    if (!this.mapReady || !this.pickupMarker || !this.destinationMarker) {
      return;
    }

    const L = this.L as any;
    const Routing = L.Routing ?? (window as any).L?.Routing;

    if (!Routing?.control) {
      console.warn('LRM not ready yet - retrying in 300ms');
      setTimeout(() => this.createRoute(), 300);
      return;
    }

    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }

    const start = this.pickupMarker.getLatLng();
    const end = this.destinationMarker.getLatLng();

    this.routingControl = Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      showAlternatives: false,
      fitSelectedRoutes: false,
      show: false,
      lineOptions: {
        styles: [{ color: '#0074D9', weight: 5, opacity: 0.85 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },

      createMarker: (i: number) => {
        if (i === 0) {
          return this.pickupMarker;
        }

        if (i === 1) {
          return this.destinationMarker;
        }

        return null;
      }
    }).addTo(this.map);

    this.routingControl.on('routesfound', (e: any) => {
      const route = e.routes?.[0];
      if (route) {
        this.routeCoordinates = route.coordinates.map((c: any) => ({ lat: c.lat, lng: c.lng }));
        // console.log(
        //   `Route: ${this.routeCoordinates.length} pts | ` +
        //   `${(route.summary.totalDistance / 1000).toFixed(1)} km | ` +
        //   `~${Math.round(route.summary.totalTime / 60)} min`
        // );
      }

      if (this.showRadiusCircle && this.pickup) {
        setTimeout(() => {
          this.fitToPickupArea(this.pickup.latitude, this.pickup.longitude);
        }, 100);
      }
    });

    this.routingControl.on('routingerror', (e: any) => console.error('Routing error:', e.error));
  }

  getRouteForBackend(): { lat: number; lng: number }[] {
    return this.routeCoordinates;
  }

  private addRadiusCircle(latitude: number, longitude: number) {
    if (this.radiusCircle) {
      this.map.removeLayer(this.radiusCircle);
    }

    this.radiusCircle = this.L.circle([latitude, longitude], {
      radius: 2000,
      color: '#0074D9',
      fillColor: '#0074D9',
      fillOpacity: 0.08,
      weight: 2
    }).addTo(this.map);
  }

  private addDriverMarkers(drivers: any[]) {
    this.driverMarkers.forEach(marker => {
      this.map.removeLayer(marker)
    });

    this.driverMarkers = [];

    const driverIcon = this.L.divIcon({
      html: `<div style="
      background: #1a1a2e;
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

    drivers.forEach(driver => {
      const marker = this.L.marker(
        [driver.latitude, driver.longitude],
        { icon: driverIcon, title: driver.driverName }
      ).addTo(this.map);

      marker.bindPopup(`
      <b>&#128663; ${driver.driverName}</b><br>
      ${driver.vehicleName}<br>
      ${driver.availableSeats} seats • ${driver.distanceKm} km away
    `);

      this.driverMarkers.push(marker);
    });
  }

  private fitToPickupArea(latitude: number, longitude: number) {
    const bounds = this.L.latLngBounds([
      [latitude - 0.02, longitude - 0.02],
      [latitude + 0.02, longitude + 0.02]
    ]);

    this.map.fitBounds(bounds, { padding: [20, 20] });
  }

  public updateDrivers(drivers: any[]) {
    console.log('updateDrivers called, mapReady:', this.mapReady, 'drivers:', drivers.length);

    if (!this.mapReady) {
      return;
    }

    this.addDriverMarkers(drivers);

    if (this.pickup) {
      this.fitToPickupArea(this.pickup.latitude, this.pickup.longitude);
    }
  }

  public centerOnDriver(latitude: number, longitude: number, driverName: string) {
    if (!this.mapReady) {
      return;
    }

    this.map.setView([latitude, longitude], 15);
  }
}
