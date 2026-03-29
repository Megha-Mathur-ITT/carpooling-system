import {
  Component,
  Output,
  EventEmitter,
  Inject,
  PLATFORM_ID,
  OnChanges,
  SimpleChanges,
  Input
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
export class RideForm implements OnChanges {

  @Output() sessionStarted = new EventEmitter<void>();
  @Output() sessionStopped = new EventEmitter<void>();
  @Output() currentLocationDetected = new EventEmitter<SelectedLocation>();
  @Output() destinationSelected = new EventEmitter<SelectedLocation>();

  @Input() currentLocation: SelectedLocation | null = null;
  @Input() destination: SelectedLocation | null = null;

  currentLocationName: string = '';
  destinationName: string = '';
  currentLat: number = 0;
  currentLng: number = 0;
  pickup: SelectedLocation | null = null;
  destinationInternal: SelectedLocation | null = null;
  seatCount: number = 4;

  @Input() isOnline: boolean = false;
  isLoading = false;
  vehicleId: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private rideSessionService: RideSessionService,
    private locationService: LocationService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.detectCurrentLocation();
      this.fetchVehicle();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentLocation'] && this.currentLocation) {
      this.pickup = this.currentLocation;
      this.currentLocationName = this.currentLocation.name;
    }
    if (changes['destination'] && this.destination) {
      this.destinationInternal = this.destination;
      this.destinationName = this.destination.name; 
    }
  }

  private detectCurrentLocation(): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      this.currentLat = latitude;
      this.currentLng = longitude;
      const placeName = await this.fetchLocationName(latitude, longitude);
      this.currentLocationName = placeName;
      const loc: SelectedLocation = { latitude, longitude, name: placeName };
      if (!this.pickup) {
        this.pickup = loc;
        this.currentLocationDetected.emit(loc);
      }
    }, () => {
      this.currentLocationName = 'Location unavailable';
    });
  }

  private fetchVehicle(): void {
    this.rideSessionService.getMyVehicle().subscribe({
      next: (vehicle: any) => {
        this.vehicleId = vehicle.vehicleId;
        this.seatCount = vehicle.maxSeats;
      }
    });
  }

  onPickupSelected(location: SelectedLocation): void {
    this.pickup = location;
    this.currentLocationName = location.name;
    this.currentLocationDetected.emit(location);
  }

  onDestinationSelected(location: SelectedLocation): void {
    this.destinationInternal = location;
    this.destinationName = location.name;
    this.destinationSelected.emit(location);
  }

  canPublish(): boolean {
    return !!this.pickup && !!this.destinationInternal && !!this.vehicleId && !this.isLoading;
  }

  publishRide(): void {
    if (!this.canPublish()) return;
    this.isLoading = true;

    const dto = {
      vehicleId: this.vehicleId,
      pickup: {
        latitude: this.pickup!.latitude,
        longitude: this.pickup!.longitude,
        name: this.pickup!.name
      },
      destination: {
        latitude: this.destinationInternal!.latitude,
        longitude: this.destinationInternal!.longitude,
        name: this.destinationInternal!.name
      },
      availableSeats: this.seatCount
    };

    this.rideSessionService.startSession(dto).subscribe({
      next: () => {
        this.isOnline = true;
        this.locationService.updateLocation(this.pickup!.latitude, this.pickup!.longitude);
        this.sessionStarted.emit();
        this.isLoading = false;
      },
      error: () => {
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
      error: () => {
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
    } catch {
      return 'Current Location';
    }
  }
} 