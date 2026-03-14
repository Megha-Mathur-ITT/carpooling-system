import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { DriverDetailsCard } from '../../../../shared/components/driver-details-card/driver-details-card';
import { MapComponent } from '../../../../shared/components/map/map';
import { LocationService } from '../../../../core/services/location-service';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-passenger-ride-selection',
  standalone: true,
  imports: [CommonModule, NavbarComponent, Footer, DriverDetailsCard, MapComponent, MatSnackBarModule],
  templateUrl: './passenger-ride-selection-page.html',
  styleUrl: './passenger-ride-selection-page.scss',
})
export class PassengerRideSelection {
  pickupLocation: any;
  destinationLocation: any;
  drivers: any = [];
  selectedDriver: any = null;
  isLoading = false;
  private refreshInterval: any;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private locationService: LocationService,
    private passengerRideService: PassengerRideService,
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

    this.locationService.getNearbyDrivers(
      this.pickupLocation.latitude,
      this.pickupLocation.longitude,
      2000
    ).subscribe({
      next: (response: any) => {
        this.drivers = response.drivers;
        this.isLoading = false;
      },
      error: () => {
        this.drivers = [];
        this.isLoading = false;
        this.snackBar.open("Could not load nearby drivers. Retrying in 30 seconds.", 'close', {
          duration: 4000,
          horizontalPosition: "center",
          verticalPosition: "top",
          panelClass: ['error-snackbar']
        });
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