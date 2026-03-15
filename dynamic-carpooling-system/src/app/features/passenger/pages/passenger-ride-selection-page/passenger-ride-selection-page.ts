import { ChangeDetectorRef, Component, ViewChild, OnInit, OnDestro } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { DriverDetailsCard } from '../../../../shared/components/driver-details-card/driver-details-card';
import { MapComponent } from '../../../../shared/components/map/map';
import { LocationService } from '../../../../core/services/location-service';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { RideRequestService } from '../../../../core/services/ride-request-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-passenger-ride-selection',
  standalone: true,
  imports: [CommonModule, NavbarComponent, Footer, DriverDetailsCard, MapComponent, MatSnackBarModule],
  templateUrl: './passenger-ride-selection-page.html',
  styleUrl: './passenger-ride-selection-page.scss',
})
export class PassengerRideSelection implements OnInit, OnDestroy {
  pickupLocation: any;
  destinationLocation: any;
  drivers: any = [];
  selectedDriver: any = null;
  isLoading = false;
  isRequesting = false;
  private refreshInterval: any;

  @ViewChild(MapComponent) mapComponent!: MapComponent;
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private locationService: LocationService,
    private passengerRideService: PassengerRideService,
    private changeDetectorRef: ChangeDetectorRef
    private rideRequestService: RideRequestService
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
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadNearbyDrivers() {
    this.isLoading = true;
    this.locationService.getNearbyDrivers(
      this.pickupLocation.latitude,
      this.pickupLocation.longitude,
      2000
    ).subscribe({
      next: (response: any) => {
        this.drivers = [...response.drivers];
        this.isLoading = false;

        if (this.mapComponent) {
          this.mapComponent.updateDrivers(this.drivers);
        }

        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.drivers = [];
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();

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

    if (this.mapComponent) {
      this.mapComponent.centerOnDriver(driver.latitude, driver.longitude, driver.driverName);
    }
  }

  requestRide() {
    if (!this.selectedDriver) return;

    this.isRequesting = true;

    this.rideRequestService.submitRequest({
      driverId: this.selectedDriver.driverId,
      pickup: {
        name: this.pickupLocation.name,
        latitude: this.pickupLocation.latitude,
        longitude: this.pickupLocation.longitude
      },
      destination: {
        name: this.destinationLocation.name,
        latitude: this.destinationLocation.latitude,
        longitude: this.destinationLocation.longitude
      }
    }).subscribe({
      next: (response: any) => {
        this.passengerRideService.rideRequestId = response.id;
        this.isRequesting = false;
        this.router.navigate(['/passenger/ride-confirmation']);
      },
      error: () => {
        this.isRequesting = false;
        this.snackBar.open(
          "Failed to send ride request. Please try again.",
          'close',
          { duration: 3000, horizontalPosition: "center", verticalPosition: "top", panelClass: ['error-snackbar'] }
        );
      }
    });
  }
}