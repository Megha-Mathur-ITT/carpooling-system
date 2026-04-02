import { ChangeDetectorRef, Component, ViewChild, OnInit, OnDestroy, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { MapComponent } from '../../../../shared/components/map/map';
import { LocationService } from '../../../../core/services/location-service';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { SignalrService } from '../../../../core/services/signalr';
import { RideSummary } from '../../../../shared/components/ride-summary/ride-summary';
import { NearbyDriversList } from '../../components/ride-selection-page/nearby-drivers-list/nearby-drivers-list';
import { RideRequestPending } from '../../components/ride-selection-page/ride-request-pending/ride-request-pending';
import { RideRequestService } from '../../../../core/services/ride-request-service';

@Component({
  selector: 'app-passenger-ride-selection',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    Footer,
    MapComponent,
    MatSnackBarModule,
    RideSummary,
    NearbyDriversList,
    RideRequestPending
  ],
  templateUrl: './passenger-ride-selection-page.html',
  styleUrl: './passenger-ride-selection-page.scss',
})
export class PassengerRideSelection implements OnInit, OnDestroy {
  pickupLocation: any = null;
  destinationLocation: any = null;
  drivers: any[] = [];
  selectedDriver: any = null;
  isLoading = false;
  isRequesting = false;
  isWaiting = false;
  rideRequestId: any = null;

  rejectedDriverIds = new Set<string>()
  private refreshInterval: any;
  private redirectTimeout: any;
  private subs: Subscription[] = [];

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private locationService: LocationService,
    private passengerRideService: PassengerRideService,
    private changeDetectorRef: ChangeDetectorRef,
    private signalrService: SignalrService,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object,
    private rideRequestService: RideRequestService
  ) { }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.pickupLocation = this.passengerRideService.pickup;
    this.destinationLocation = this.passengerRideService.destination;
    this.rideRequestId = this.passengerRideService.rideRequestId;

    if (!this.pickupLocation) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    if (!this.destinationLocation) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    if (!this.passengerRideService.rideRequestId) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    this.signalrService.resetRideState();
    this.signalrService.connect();
    this.loadNearbyDrivers();
    this.refreshInterval = setInterval(() => this.loadNearbyDrivers(), 10000);

    this.listenToRideAcceptedEvent();
    this.listenToRideRejectedEvent();
  }

  get hasRejections(): boolean {
    return this.rejectedDriverIds.size > 0;
  }

  private listenToRideRejectedEvent() {
    this.subs.push(
      this.signalrService.rideRejected$.subscribe(data => {
        if (data) {
          this.ngZone.run(() => {
            this.isWaiting = false;

            if (this.selectedDriver?.driverId) {
              this.rejectedDriverIds.add(this.selectedDriver.driverId);
            }

            this.selectedDriver = null;
            this.filterRejectedDrivers();
            this.changeDetectorRef.detectChanges();

            this.snackBar.open(
              'Driver declined. Please choose another.',
              'Close',
              { duration: 4000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['error-snackbar'] }
            );

            if (this.drivers.length === 0) {
              this.scheduleRedirectToLanding(
                'No more drivers available. Redirecting...'
              );
            }
          })
        }
      })
    );
  }

  private listenToRideAcceptedEvent() {
    this.subs.push(
      this.signalrService.rideAccepted$.subscribe(data => {
        if (data) {
          this.ngZone.run(() => {
            this.isWaiting = false;
            this.changeDetectorRef.detectChanges();

            this.snackBar.open(
              'Driver accepted your ride!',
              'Close',
              { duration: 4000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['success-snackbar'] }
            );

            this.router.navigate(['/passenger/ride-confirmation']);
          });
        }
      })
    );
  }

  loadNearbyDrivers() {
    this.isLoading = true;

    this.locationService.getNearbyDrivers(
      this.pickupLocation.latitude,
      this.pickupLocation.longitude,
      this.destinationLocation.latitude,
      this.destinationLocation.longitude,
      2000
    ).subscribe({
      next: (response: any) => {
        this.drivers = [...response.drivers];
        this.drivers = this.drivers.filter((driver: any) => {
          return !this.rejectedDriverIds.has(driver.driverId)
        });

        this.isLoading = false;

        if (this.mapComponent) {
          this.mapComponent.updateDrivers(this.drivers);
        }
        this.changeDetectorRef.detectChanges();   
      },
      error: (error) => {
        this.drivers = [];
        this.isLoading = false;
        if (error.status !== 404) {
          this.snackBar.open("Could not load nearby drivers. Retrying in 10 seconds.", 'close', {
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

  private filterRejectedDrivers(): void {
    this.drivers = this.drivers.filter(
      driver => !this.rejectedDriverIds.has(driver.driverId)
    );

    if (this.mapComponent) {
      this.mapComponent.updateDrivers(this.drivers);
    }
  }

  selectDriver(driver: any) {
    this.selectedDriver = driver;
    if (this.mapComponent) {
      this.mapComponent.centerOnDriver(driver.latitude, driver.longitude, driver.driverName);
    }
  }

  cancelRequest() {
    const driverId = this.selectedDriver?.driverId;
    if (driverId) {
      this.rejectedDriverIds.add(driverId);
      this.filterRejectedDrivers();
      this.signalrService.notifyCancelRequest(this.rideRequestId, driverId);
    }

    this.isWaiting = false;
    this.selectedDriver = null;
    this.changeDetectorRef.detectChanges();

    if (this.drivers.length === 0) {
      this.scheduleRedirectToLanding('No more drivers available. Redirecting...');
    }
  }

  private scheduleRedirectToLanding(message: string): void {
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });

    this.redirectTimeout = setTimeout(() => {
      this.router.navigate(['/passenger/landing']);
    }, 3000);
  }

  requestRide() {
    if (!this.selectedDriver) {
      return;
    }

    if (this.rejectedDriverIds.has(this.selectedDriver.driverId)) {
      this.snackBar.open(
        'This driver already declined your request.',
        'Close',
        { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['error-snackbar'] }
      );
      return;
    }

    const rideRequestId = this.passengerRideService.rideRequestId;

    if (!rideRequestId) {
      this.snackBar.open(
        'Ride session expired. Please go back and try again.',
        'Close',
        { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['error-snackbar'] }
      );

      return;
    }

    this.isRequesting = true;
    this.changeDetectorRef.detectChanges();

    this.signalrService.notifyDriver(
      this.selectedDriver.driverId,
      rideRequestId,
      this.selectedDriver.sessionId,
      this.pickupLocation,
      this.destinationLocation
    );

    this.passengerRideService.setSelectedDriver(this.selectedDriver);
    this.isRequesting = false;
    this.isWaiting = true;
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }

    this.subs.forEach(s => s.unsubscribe());
  }
}