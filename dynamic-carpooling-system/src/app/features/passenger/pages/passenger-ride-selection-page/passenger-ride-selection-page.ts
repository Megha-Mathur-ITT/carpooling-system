import { ChangeDetectorRef, Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { DriverDetailsCard } from '../../../../shared/components/driver-details-card/driver-details-card';
import { MapComponent } from '../../../../shared/components/map/map';
import { LocationService } from '../../../../core/services/location-service';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { CommonModule } from '@angular/common';
import { SignalrService } from '../../../../core/services/signalr';

@Component({
  selector: 'app-passenger-ride-selection',
  standalone: true,
  imports: [CommonModule, NavbarComponent, Footer, DriverDetailsCard, MapComponent, MatSnackBarModule],
  templateUrl: './passenger-ride-selection-page.html',
  styleUrl: './passenger-ride-selection-page.scss',
})
export class PassengerRideSelection implements OnInit, OnDestroy {
  pickupLocation: any = null;
  destinationLocation: any = null;
  drivers: any = [];
  selectedDriver: any = null;
  isLoading = false;
  isRequesting = false;
  isWaiting = false;
  private refreshInterval: any;
  private subs: any[] = [];

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private locationService: LocationService,
    private passengerRideService: PassengerRideService,
    private changeDetectorRef: ChangeDetectorRef,
    private signalrService: SignalrService
  ) {
    this.pickupLocation = this.passengerRideService.pickup;
    this.destinationLocation = this.passengerRideService.destination;
  }

  ngOnInit() {
    if (!this.pickupLocation) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    this.signalrService.connect();
    this.loadNearbyDrivers();
    this.refreshInterval = setInterval(() => this.loadNearbyDrivers(), 10000);

    this.subs.push(
      this.signalrService.rideAccepted$.subscribe(data => {
        if (data) {
          this.isWaiting = false;
          this.snackBar.open(
            'Driver accepted your ride!',
            'Close',
            { duration: 4000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['success-snackbar'] }
          );
          this.router.navigate(['/passenger/ride-confirmation']);
          this.changeDetectorRef.detectChanges();
        }
      })
    );

    // Listen for driver rejecting
    this.subs.push(
      this.signalrService.rideRejected$.subscribe(data => {
        if (data) {
          this.isWaiting = false;
          this.selectedDriver = null;
          this.snackBar.open(
            'Driver declined. Please choose another.',
            'Close',
            { duration: 4000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['error-snackbar'] }
          );
          this.changeDetectorRef.detectChanges();
        }
      })
    );

    // TODO: replace with loadNearbyDrivers() once Megha's API is ready
    /*this.drivers = [{
      driverId: 'c56a8e3e-d7d9-4a02-f85d-08de81f17c06',
      driverName: 'Hiya',
      vehicleName: 'Verna',
      availableSeats: 3,
      distanceKm: 0.5,
      latitude: 26.92,
      longitude: 75.71
    }];*/
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.subs.forEach(s => s.unsubscribe());
  }

  loadNearbyDrivers() {
    this.isLoading = true;
    console.log("Loading drivers...");

    this.locationService.getNearbyDrivers(
      this.pickupLocation.latitude,
      this.pickupLocation.longitude,
      2000
    ).subscribe({
      next: (response: any) => {
        console.log("Drivers nearby: ", response.drivers);
        this.drivers = [...response.drivers];
        this.isLoading = false;

        if (this.mapComponent) {
          this.mapComponent.updateDrivers(this.drivers);
        }

        this.changeDetectorRef.markForCheck();
      },
      error: (error) => {
        this.drivers = [];
        this.isLoading = false;

        if (error.status !== 404) {
          this.snackBar.open("Could not load nearby drivers. Retrying in 30 seconds.", 'close', {
            duration: 4000,
            horizontalPosition: "center",
            verticalPosition: "top",
            panelClass: ['error-snackbar']
          });
        }

        this.changeDetectorRef.detectChanges();
      }
    });
  }

  selectDriver(driver: any) {
    this.selectedDriver = driver;

    if (this.mapComponent) {
      this.mapComponent.centerOnDriver(driver.latitude, driver.longitude, driver.driverName);
    }
  }

  cancelRequest() {
    this.isWaiting = false;
    this.selectedDriver = null;
    this.changeDetectorRef.detectChanges();
  }

  requestRide() {
    if (!this.selectedDriver) return;

    this.isRequesting = true;
    const rideRequestId = this.passengerRideService.rideRequestId;

    if (!rideRequestId) {
      this.snackBar.open("Ride session expired. Please go back and try again.", 'close', {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "top",
        panelClass: ['error-snackbar']
      });
      this.isRequesting = false;
      return;
    }

       this.signalrService.notifyDriver(
      this.selectedDriver.driverId,
      rideRequestId,
      this.pickupLocation,
      this.destinationLocation
    );
    
    this.passengerRideService.selectedDriver = this.selectedDriver;

    this.rideRequestService.notifyDriver(rideRequestId, this.selectedDriver.driverId)
      .subscribe({
        next: () => {
          this.isRequesting = false;
          this.isWaiting = true;
          this.changeDetectorRef.detectChanges();
        },
        error: () => {
          this.isRequesting = false;
          this.snackBar.open("Failed to send request.", 'close', {
            duration: 3000,
            horizontalPosition: "center",
            verticalPosition: "top",
            panelClass: ['error-snackbar']
          });
        }
      });
  }
}