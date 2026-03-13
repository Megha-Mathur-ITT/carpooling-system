import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { DriverDetailsCard } from '../../../../shared/components/driver-details-card/driver-details-card';
import { MapComponent } from '../../../../shared/components/map/map';
import { LocationTrackingService } from '../../../../core/services/location-tracking-service';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { RideRequestService } from '../../../../core/services/ride-request-service';

@Component({
  selector: 'app-passenger-ride-selection',
  standalone: true,
  imports: [NavbarComponent, Footer, DriverDetailsCard, MapComponent],
  templateUrl: './passenger-ride-selection-page.html',
  styleUrl: './passenger-ride-selection-page.scss',
})
export class PassengerRideSelection {
  pickupLocation: any;
  destinationLocation: any;
  drivers: any = [];
  selectedDriver: any = [];
  isLoading = false;
  private refreshInterval: any;

  constructor(
    private router: Router,
    private locationTrackingService: LocationTrackingService,
    private passengerRideService: PassengerRideService,
    private rideRequestService: RideRequestService,
  ) {
    this.pickupLocation = this.passengerRideService.pickup;
    this.destinationLocation = this.passengerRideService.destination;
  }

  ngOnInit() {
    if (!this.pickupLocation) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    this.loadNearbyDrivers();
    this.refreshInterval = setInterval(() => this.loadNearbyDrivers(), 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadNearbyDrivers() {
    this.isLoading = true;

    this.locationTrackingService.getNearbyDrivers(
      this.pickupLocation.latitude,
      this.pickupLocation.longitude,
      2000
    ).subscribe({
      next: (response) => {
        console.log("RES getNearbyDrivers: ", response);
        this.drivers = response.drivers;
        this.isLoading = false;
      },
      error: () => {
        this.drivers = [];
        this.isLoading = false;
      }
    });
  }

  selectDriver(driver: any) {
    this.selectedDriver = driver;
  }

  requestRide() {
    if (!this.selectedDriver) {
      return;
    }

    // this.router.navigate(['/passenger/ride-confirmation']);
  }
}