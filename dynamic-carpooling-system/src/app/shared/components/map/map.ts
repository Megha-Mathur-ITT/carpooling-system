import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy, Input } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrls: ['./map.scss']
})
export class MapComponent implements OnInit, OnDestroy {

  map: any;
  L: any;

  pickupMarker: any;
  destinationMarker: any;
  routingControl: any;
  liveMarker: any;                   

  private pendingPickup: any = null;
  private pendingDestination: any = null;
  private mapReady = false;
  private watchId: number | null = null;

  isTracking = false;                 

  routeCoordinates: { lat: number; lng: number }[] = [];

  private defaultPickup = {
    latitude: 26.9124,
    longitude: 75.7873,
    name: 'Jaipur, Rajasthan, India'
  };

  @Input() pickup: any;
  @Input() destination: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

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
    if (mapContainer != null) mapContainer._leaflet_id = null;

    this.map = this.L.map('map').setView(
      [this.defaultPickup.latitude, this.defaultPickup.longitude], 13
    );

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.pickupMarker = this.L.marker(
      [this.defaultPickup.latitude, this.defaultPickup.longitude],
      { icon: this.makeIcon(), title: 'Pickup' }
    ).addTo(this.map);
    this.pickupMarker.bindPopup('<b>📍 Pickup</b><br>Jaipur, Rajasthan').openPopup();

    this.mapReady = true;

    if (this.pendingPickup) {
      this.applyPickup(this.pendingPickup);
      this.pendingPickup = null;
    }
    if (this.pendingDestination) {
      this.applyDestination(this.pendingDestination);
      this.pendingDestination = null;
    }

    this.startLiveLocation();
  }

  ngOnDestroy() {
    this.stopLiveLocation();
  }

  ngOnChanges() {
    if (!this.mapReady) {
      if (this.pickup)      this.pendingPickup = this.pickup;
      if (this.destination) this.pendingDestination = this.destination;
      return;
    }
    if (this.pickup)      this.applyPickup(this.pickup);
    if (this.destination) this.applyDestination(this.destination);
  }

  startLiveLocation() {
    if (!navigator.geolocation) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.updateLiveDot(latitude, longitude);
        this.isTracking = true;
      },
      (err) => {
        console.warn('[Map] Geolocation error:', err.message);
        this.isTracking = false;
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  stopLiveLocation() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
    }
  }

  private updateLiveDot(lat: number, lng: number) {
    if (!this.mapReady) return;

    const blueIcon = this.L.divIcon({
      className: '',
      html: `<div style="
        width:16px;height:16px;
        background:#2563EB;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 0 0 3px rgba(37,99,235,0.3)">
      </div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    if (this.liveMarker) {
      this.liveMarker.setLatLng([lat, lng]);
    } else {
      this.liveMarker = this.L.marker([lat, lng], {
        icon: blueIcon,
        zIndexOffset: 1000,
        title: 'Your location'
      }).addTo(this.map);
    }
  }

  setPickup(location: any) {
    if (!this.mapReady) { this.pendingPickup = location; return; }
    this.applyPickup(location);
  }

  setDestination(location: any) {
    if (!this.mapReady) { this.pendingDestination = location; return; }
    this.applyDestination(location);
  }

  private applyPickup(location: any) {
    const { latitude, longitude, name } = location;
    if (this.pickupMarker) {
      this.pickupMarker.setLatLng([latitude, longitude]);
    } else {
      this.pickupMarker = this.L.marker(
        [latitude, longitude],
        { icon: this.makeIcon(), title: 'Pickup' }
      ).addTo(this.map);
    }
    this.pickupMarker.bindPopup(`<b>📍 Pickup</b><br>${name}`).openPopup();
    if (this.destinationMarker) {
      this.fitMapToBothMarkers();
      this.createRoute();
    }
  }

  private applyDestination(location: any) {
    const { latitude, longitude, name } = location;
    if (this.destinationMarker) {
      this.destinationMarker.setLatLng([latitude, longitude]);
    } else {
      this.destinationMarker = this.L.marker(
        [latitude, longitude],
        { icon: this.makeIcon(), title: 'Destination' }
      ).addTo(this.map);
    }
    this.destinationMarker.bindPopup(`<b>🏁 Destination</b><br>${name}`).openPopup();
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
        if (i === 0) return this.pickupMarker;
        if (i === 1) return this.destinationMarker;
        return null;
      }
    }).addTo(this.map);

    this.routingControl.on('routesfound', (e: any) => {
      const route = e.routes?.[0];
      if (route) {
        this.routeCoordinates = route.coordinates.map(
          (c: any) => ({ lat: c.lat, lng: c.lng })
        );
      }
    });

    this.routingControl.on('routingerror', (e: any) =>
      console.error('Routing error:', e.error)
    );
  }

  getRouteForBackend(): { lat: number; lng: number }[] {
    return this.routeCoordinates;
  }

  private loadScriptOnce(id: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) { resolve(); return; }
      const script = document.createElement('script');
      script.id  = id;
      script.src = src;
      script.onload  = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load: ${src}`));
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
}