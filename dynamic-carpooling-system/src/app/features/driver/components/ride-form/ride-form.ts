import {
  Component, Output, EventEmitter,
  Inject, PLATFORM_ID, afterNextRender
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LocationSearchComponent,
  SelectedLocation
} from '../../../../shared/components/location-search/location-search';
import { RideSessionService } from '../../services/ride-session';
import { LocationService } from '../../../../core/services/location-service';

@Component({
  selector: 'app-ride-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationSearchComponent],
  templateUrl: './ride-form.html',
  styleUrl: './ride-form.scss',
})
export class RideForm {

  @Output() sessionStarted = new EventEmitter<void>();
  @Output() sessionStopped = new EventEmitter<void>();
  @Output() currentLocationDetected = new EventEmitter<SelectedLocation>();
  @Output() destinationSelected = new EventEmitter<SelectedLocation>();

  currentLocationName: string = '';
  currentLat: number = 0;
  currentLng: number = 0;
  pickup: SelectedLocation | null = null;
  destination: SelectedLocation | null = null;
  seatCount: number = 4;

  isOnline = false;
  isLoading = false;
  vehicleId: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private rideSessionService: RideSessionService,
    private locationService: LocationService
  ) {
    afterNextRender(() => {
      this.detectCurrentLocation();
      this.fetchVehicle();
    });
  }

    private detectCurrentLocation(): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      this.currentLat = latitude;
      this.currentLng = longitude;

      const placeName = await this.fetchLocationName(latitude, longitude);

      this.currentLocationName = placeName;

      const loc: SelectedLocation = {
        latitude,
        longitude,
        name: placeName
      };

      this.pickup = loc;

      this.currentLocationDetected.emit(loc);

    }, () => {
      this.currentLocationName = 'Location unavailable';
    });
  }

  private fetchVehicle(): void {
    this.rideSessionService.getMyVehicle().subscribe({
      next: (vehicle: any) => {
        console.log('[RideForm] Vehicle fetched:', vehicle);
        this.vehicleId = vehicle.vehicleId;
        this.seatCount = vehicle.maxSeats;
      },
      error: (err: any) => {
        console.warn('[RideForm] No vehicle found:', err.status);
      }
    });
  }

  onPickupSelected(location: SelectedLocation): void {
    this.pickup = location;
    this.currentLocationName = location.name;
    this.currentLocationDetected.emit(location);
  }

  onDestinationSelected(location: SelectedLocation): void {
    this.destination = location;
    this.destinationSelected.emit(location);
  }

  canPublish(): boolean {
    return !!this.pickup && !!this.destination && !!this.vehicleId && !this.isLoading;
  }

  publishRide(): void {
    if (!this.canPublish()) return;
    this.isLoading = true;

    const dto = {
      vehicleId: this.vehicleId,
      pickup: this.pickup!.name,
      dropoff: this.destination!.name,
      availableSeats: this.seatCount
    };

    console.log('[RideForm] Sending dto:', JSON.stringify(dto));

    this.rideSessionService.startSession(dto).subscribe({
      next: () => {
        this.isOnline = true;

        this.locationService.updateLocation(
          this.pickup!.latitude,
          this.pickup!.longitude
        );

        this.sessionStarted.emit();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('[RideForm] Failed to start session:', err.error);
        this.isLoading = false;
      }
    });
  }

  goOffline(): void {
    this.isLoading = true;
    this.locationService.stopTracking();

    this.rideSessionService.stopSession().subscribe({
      next: () => {
        this.isOnline = false;
        this.sessionStopped.emit();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('[RideForm] Failed to stop session:', err);
        this.isLoading = false;
      }
    });
  }

  private async fetchLocationName(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );

    const data = await res.json();

    return data.display_name || 'Current Location';
  } catch (err) {
    console.error('Reverse geocoding failed', err);
    return 'Current Location';
  }
}
}