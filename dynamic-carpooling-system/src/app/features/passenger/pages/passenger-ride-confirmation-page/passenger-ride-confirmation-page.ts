import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { MapComponent } from '../../../../shared/components/map/map';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { RideSummary } from '../../../../shared/components/ride-summary/ride-summary';
import { AuthService } from '../../../../core/services/auth-service';
import { RideStatus } from '../../components/ride-confirmation-page/ride-status/ride-status';
import { reverseGeocode, trimLocation } from '../../../../shared/utils/locationUtil';
import { Subscription } from 'rxjs';
import { SignalrService } from '../../../../core/services/signalr';

@Component({
  selector: 'app-passenger-ride-confirmation',
  standalone: true,
  imports: [CommonModule, NavbarComponent, Footer, MapComponent, RideSummary, RideStatus],
  templateUrl: './passenger-ride-confirmation-page.html',
  styleUrl: './passenger-ride-confirmation-page.scss',
})
export class PassengerRideConfirmationPage implements OnInit, AfterViewInit, OnDestroy {
  passengerPickup: any = null;
  passengerDestination: any = null;
  selectedDriver: any = null;
  driverLocation: any = null;
  isDriverArrived = false;
  isRideStarted = false;
  isReachedDestination = false;
  passengerPin: string = '';
  fare: number = 0;
  distanceKm: number = 0;
  isPinVerified = false;
  isPinFailed = false;
  pinAttempts = 0;
  readonly maxPinAttempts = 3;
  isRideOnHold = false;
  private latestDriverPosition: { latitude: number; longitude: number } | null = null;

  private pinSub!: Subscription;
  private locationSub!: Subscription;
  private arrivedSub!: Subscription;
  private holdSub!: Subscription;
  private completedSub!: Subscription;
  private resumeSub!: Subscription;

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  constructor(
    private router: Router,
    private passengerRideService: PassengerRideService,
    private changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private ngZone: NgZone,
    private signalrService: SignalrService,
  ) {}

  async ngOnInit() {
    this.passengerPickup = this.passengerRideService.pickup;
    this.passengerDestination = this.passengerRideService.destination;
    this.selectedDriver = this.passengerRideService.selectedDriver;

    if (!this.passengerPickup || !this.passengerDestination || !this.selectedDriver) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    this.fare = this.passengerRideService.fare;
    this.distanceKm = this.passengerRideService.distanceKm;

    await this.loadPin();
    this.changeDetectorRef.markForCheck();

    this.listenToDriverLocation();
    this.listenToEventPinVerified();
    this.listenToDriverArrived();
    this.listenToRideOnHold();
    this.listenToRideCompleted();
    this.listenToRideResumed();
  }

  ngAfterViewInit() {
    this.mapComponent.mapReady$.subscribe(() => {
      if (this.selectedDriver) {
        this.mapComponent.updateDriverMarker(
          this.selectedDriver.latitude,
          this.selectedDriver.longitude,
        );
      }
    });
  }

  listenToRideOnHold() {
    this.holdSub = this.signalrService.rideOnHold$.subscribe(() => {
      this.ngZone.run(() => {
        this.isRideOnHold = true;
        this.changeDetectorRef.markForCheck();
      });
    });
  }

  listenToDriverArrived() {
    this.arrivedSub = this.signalrService.driverArrived$.subscribe(() => {
      this.ngZone.run(() => {
        this.isDriverArrived = true;
        this.isRideOnHold = false;

        if (this.mapComponent && this.passengerPickup) {
          this.mapComponent.updateDriverMarker(
            this.passengerPickup.latitude,
            this.passengerPickup.longitude,
          );
        }

        if (!this.passengerPin || this.passengerPin === '------') {
          this.loadPin();
        }

        this.changeDetectorRef.markForCheck();
      });
    });
  }

  listenToDriverLocation() {
    this.locationSub = this.signalrService.locationUpdate$.subscribe((pos) => {
      this.ngZone.run(() => {
        if (!this.mapComponent || !pos.latitude || !pos.longitude) {
          return;
        }

        this.latestDriverPosition = { latitude: pos.latitude, longitude: pos.longitude };
        this.mapComponent.updateDriverMarker(pos.latitude, pos.longitude);

        if (!this.isDriverArrived && !this.isPinVerified && this.passengerPickup) {
          const dist = this.getDistanceMeters(
            pos.latitude,
            pos.longitude,
            this.passengerPickup.latitude,
            this.passengerPickup.longitude,
          );
          if (dist < 40) {
            setTimeout(() => {
              this.isDriverArrived = true;
              if (!this.passengerPin) {
                this.loadPin();
              }
              this.changeDetectorRef.markForCheck();
            });
          }
        }

        if (!this.isPinVerified && this.passengerPickup) {
          this.mapComponent.fitToShowDriverAndPickup(
            pos.latitude,
            pos.longitude,
            this.passengerPickup.latitude,
            this.passengerPickup.longitude,
          );
        } else if (this.isPinVerified && !this.isReachedDestination && this.passengerDestination) {
          this.mapComponent.fitToShowDriverAndPickup(
            pos.latitude,
            pos.longitude,
            this.passengerDestination.latitude,
            this.passengerDestination.longitude,
          );
        }
      });
    });
  }

  listenToEventPinVerified() {
    this.pinSub = this.signalrService.pinVerified$.subscribe((data) => {
      this.ngZone.run(() => {
        if (data.success) {
          this.isPinVerified = true;
          this.isPinFailed = false;
          this.isDriverArrived = true;
          this.isRideStarted = true;
          this.isRideOnHold = false;

          this.changeDetectorRef.markForCheck();
        } else {
          this.pinAttempts++;
          this.isPinFailed = true;
          this.isDriverArrived = true;
          this.changeDetectorRef.markForCheck();

          if (this.pinAttempts >= this.maxPinAttempts) {
            setTimeout(() => {
              this.router.navigate(['/passenger/landing']);
            }, 2000);
          }
        }
      });
    });
  }

  listenToRideCompleted() {
    this.completedSub = this.signalrService.rideCompleted$.subscribe(() => {
      this.ngZone.run(() => {
        this.isRideStarted = false;
        this.isReachedDestination = true;
        this.changeDetectorRef.markForCheck();
      });
    });
  }

  listenToRideResumed() {
    this.resumeSub = this.signalrService.rideResumed$.subscribe(() => {
      this.ngZone.run(() => {
        this.isRideOnHold = false;
        this.changeDetectorRef.markForCheck();
      });
    });
  }

  get passengerPinDigits(): string[] {
    const pin = this.passengerPin || '------';
    return pin.split('');
  }

  private loadPin(): Promise<void> {
    return new Promise((resolve) => {
      this.authService.getMyPin().subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.passengerPin = response.pin;
            this.changeDetectorRef.detectChanges();

            resolve();
          });
        },
        error: (error) => {
          console.error('[PIN] Failed to load:', error);
          resolve();
        },
      });
    });
  }

  goToPayment() {
    const paymentState = {
      fare: this.fare,
      distanceKm: this.distanceKm,
      driver: this.selectedDriver,
      pickup: this.passengerPickup,
      destination: this.passengerDestination,
      driverId: this.selectedDriver.driverId,
      rideRequestId: this.passengerRideService.rideRequestId,
    };

    sessionStorage.setItem('payment_state', JSON.stringify(paymentState));

    this.router.navigate(['passenger/payment'], {
      state: paymentState,
    });
  }

  private getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  ngOnDestroy() {
    this.pinSub?.unsubscribe();
    this.locationSub?.unsubscribe();
    this.arrivedSub?.unsubscribe();
    this.holdSub?.unsubscribe();
    this.completedSub?.unsubscribe();
    this.resumeSub?.unsubscribe();
  }
}
