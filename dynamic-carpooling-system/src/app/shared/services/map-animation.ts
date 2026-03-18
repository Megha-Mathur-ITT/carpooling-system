import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MapAnimationService {

  private animationMarker: any = null;
  private animationInterval: any = null;
  private L: any = null;
  private map: any = null;

  init(mapInstance: any, leaflet: any): void {
    this.map = mapInstance;
    this.L = leaflet;
  }

  animateAlongRoute(
    routeCoordinates: { lat: number; lng: number }[]
  ): void {
    if (!this.map || !this.L) {
      return;
    }

    if (!routeCoordinates || routeCoordinates.length < 2) {
      return;
    }

    const carIcon = this.L.divIcon({
      html: `<div style="font-size:24px;">🚗</div>`,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    if (this.animationMarker) {
      this.map.removeLayer(this.animationMarker);
    }

    this.animationMarker = this.L.marker(
      [routeCoordinates[0].lat, routeCoordinates[0].lng],
      { icon: carIcon, zIndexOffset: 2000 }
    ).addTo(this.map);

    const bounds = this.L.latLngBounds(
      routeCoordinates.map(c => [c.lat, c.lng])
    );

    this.map.fitBounds(bounds, { padding: [60, 60] });

    let currentIndex = 0;
    this.stop();

    this.animationInterval = setInterval(() => {
      currentIndex++;

      if (currentIndex >= routeCoordinates.length) {
        this.stop();
        return;
      }

      if (!this.animationMarker) {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
        return;
      }

      const next = routeCoordinates[currentIndex];
      this.animationMarker.setLatLng([next.lat, next.lng]);

      this.map.panTo([next.lat, next.lng], { animate: true, duration: 0.2 });

    }, 200);
  }

  stop(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    if (this.animationMarker && this.map) {
      this.map.removeLayer(this.animationMarker);
      this.animationMarker = null;
    }
  }
}