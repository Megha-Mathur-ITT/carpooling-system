import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { LocationSearchComponent } from '../location-search/location-search';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, LocationSearchComponent],
  templateUrl: './map.html',
  styleUrls: ['./map.scss']
})
export class MapComponent implements OnInit {

  map: any;
  L: any;

  pickupMarker: any;
  destinationMarker: any;
  routingControl: any;

  private pendingPickup: any = null;
  private pendingDestination: any = null;
  private mapReady = false;

  routeCoordinates: { lat: number; lng: number }[] = [];

  private defaultPickup      = { latitude: 26.9124, longitude: 75.7873, name: 'Jaipur, Rajasthan, India' };
  private defaultDestination = { latitude: 26.9200, longitude: 75.7950, name: 'Destination, Jaipur' };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const leafletModule = await import('leaflet');
    this.L = (leafletModule as any).default ?? leafletModule;

    delete (this.L.Icon.Default.prototype as any)._getIconUrl;
    this.L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/images/marker-icon-2x.png',
      iconUrl:       'assets/images/marker-icon.png',
      shadowUrl:     'assets/images/marker-shadow.png',
      iconSize:    [25, 41],
      iconAnchor:  [12, 41],
      popupAnchor: [1, -34],
      shadowSize:  [41, 41]
    });

    (window as any).L = this.L;
    await this.loadScriptOnce(
      'leaflet-routing-machine-script',
      'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js'
    );

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

    this.destinationMarker = this.L.marker(
      [this.defaultDestination.latitude, this.defaultDestination.longitude],
      { icon: this.makeIcon(), title: 'Destination' }
    ).addTo(this.map);
    this.destinationMarker.bindPopup('<b>&#127937; Destination</b><br>Jaipur');

    this.mapReady = true;

    if (this.pendingPickup)      { this.applyPickup(this.pendingPickup);           this.pendingPickup = null; }
    if (this.pendingDestination) { this.applyDestination(this.pendingDestination); this.pendingDestination = null; }

    this.createRoute();
  }


  setPickup(location: any) {
    if (!this.mapReady) { this.pendingPickup = location; return; }
    this.applyPickup(location);
  }

  setDestination(location: any) {
    if (!this.mapReady) { this.pendingDestination = location; return; }
    this.applyDestination(location);
  }

  
  private loadScriptOnce(id: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve(); 
        return;
      }
      const script = document.createElement('script');
      script.id  = id;
      script.src = src;
      script.onload  = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  private makeIcon() {
    return this.L.icon({
      iconUrl:       'assets/images/marker-icon.png',
      iconRetinaUrl: 'assets/images/marker-icon-2x.png',
      shadowUrl:     'assets/images/marker-shadow.png',
      iconSize:    [25, 41],
      iconAnchor:  [12, 41],
      popupAnchor: [1, -34],
      shadowSize:  [41, 41]
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
    this.fitMapToBothMarkers();
    this.createRoute();
  }

  private applyDestination(location: any) {
    const { latitude, longitude, name } = location;
    if (this.destinationMarker) {
      this.destinationMarker.setLatLng([latitude, longitude]);
    } else {
      this.destinationMarker = this.L.marker([latitude, longitude], { icon: this.makeIcon(), title: 'Destination' }).addTo(this.map);
    }
    this.destinationMarker.bindPopup(`<b> &#127937; Destination</b><br>${name}`).openPopup();
    this.fitMapToBothMarkers();
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
    if (!this.mapReady || !this.pickupMarker || !this.destinationMarker) return;

    const L = this.L as any;
    const Routing = L.Routing ?? (window as any).L?.Routing;

    if (!Routing?.control) {
      console.warn('LRM not ready yet — retrying in 300ms');
      setTimeout(() => this.createRoute(), 300);
      return;
    }

    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }

    const start = this.pickupMarker.getLatLng();
    const end   = this.destinationMarker.getLatLng();

    this.routingControl = Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      routeWhileDragging: false,
      addWaypoints:       false,
      draggableWaypoints: false,
      showAlternatives:   false,
      fitSelectedRoutes:  false,
      show:               false,
      lineOptions: {
        styles: [{ color: '#0074D9', weight: 5, opacity: 0.85 }],
        extendToWaypoints:     true,
        missingRouteTolerance: 0
      },
      createMarker: (i: number) => {
        if (i === 0) return this.pickupMarker;
        if (i === 1) return this.destinationMarker;
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
    });

    this.routingControl.on('routingerror', (e: any) => console.error('Routing error:', e.error));
  }

  getRouteForBackend(): { lat: number; lng: number }[] {
    return this.routeCoordinates;
  }
}