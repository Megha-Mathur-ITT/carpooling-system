import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
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
  styleUrl: './passenger-ride-confirmation-page.scss'
})
export class PassengerRideConfirmationPage implements OnInit, OnDestroy {
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

  private pinSub!: Subscription;

  constructor(
    private router: Router,
    private passengerRideService: PassengerRideService,
    private changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private ngZone: NgZone,
    private signalrService: SignalrService
  ) { }

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  async ngOnInit() {
    this.passengerPickup = this.passengerRideService.pickup;
    this.passengerDestination = this.passengerRideService.destination;
    this.selectedDriver = this.passengerRideService.selectedDriver;

    if (!this.passengerPickup || !this.passengerDestination || !this.selectedDriver) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    if (!this.passengerRideService.fare || this.passengerRideService.fare === 0) {
      const dist = this.calculateDistanceKm(
        this.passengerPickup.latitude, this.passengerPickup.longitude,
        this.passengerDestination.latitude, this.passengerDestination.longitude
      );
      this.passengerRideService.distanceKm = dist;
      this.passengerRideService.fare = Math.round(dist * 9);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('distanceKm', dist.toString());
        sessionStorage.setItem('fare', this.passengerRideService.fare.toString());
      }
    }

    this.fare = this.passengerRideService.fare;
    this.distanceKm = this.passengerRideService.distanceKm;

    const address = await reverseGeocode({
      latitude: this.selectedDriver.latitude,
      longitude: this.selectedDriver.longitude
    });

    this.driverLocation = {
      latitude: this.selectedDriver.latitude,
      longitude: this.selectedDriver.longitude,
      name: this.selectedDriver.driverName,
      popupLabel: `<b>Driver start point:</b> ${address}`
    };

    this.changeDetectorRef.markForCheck();
    await this.loadPin();

    setTimeout(() => {
      if (this.mapComponent && this.selectedDriver && this.passengerPickup) {
        this.mapComponent.startDriverAnimation(
          this.selectedDriver,
          this.passengerPickup,
          this.passengerDestination,
          trimLocation(this.passengerPickup?.name),
          trimLocation(this.passengerDestination?.name),
          () => {
            this.ngZone.run(() => {
              this.isDriverArrived = true;
              this.isRideStarted = false
              this.changeDetectorRef.markForCheck();
            })
          },
        );
      }
    }, 1500);

    this.listenToEventPinVerified();
  }

  listenToEventPinVerified() {
    this.pinSub = this.signalrService.pinVerified$.subscribe(data => {
      this.ngZone.run(() => {
        if (data.success) {
          this.isPinVerified = true;
          this.isPinFailed = false;
          this.isDriverArrived = true;

          this.changeDetectorRef.detectChanges();

          setTimeout(() => this.startDestinationRide(), 1500);
        } else {
          this.pinAttempts++;
          this.isPinFailed = true;
          this.isDriverArrived = true;
          this.changeDetectorRef.detectChanges();

          if (this.pinAttempts >= this.maxPinAttempts) {
            setTimeout(() => {
              this.router.navigate(['/passenger/landing']);
            }, 2000);
          }
        }
      });
    });
  }

  get passengerPinDigits(): string[] {
    const pin = this.passengerPin || '------';
    return pin.split('');
  }

  startDestinationRide(): void {
    this.isRideStarted = true;
    this.isDriverArrived = false;

    this.changeDetectorRef.detectChanges();

    if (this.mapComponent) {
      this.mapComponent.startDestinationAnimation(
        this.passengerPickup,
        this.passengerDestination,
        this.driverLocation,
        () => {
          this.isRideStarted = false;
          this.isReachedDestination = true;
          this.changeDetectorRef.markForCheck();
        }
      );
    }
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
        error: () => {
          resolve();
        }
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
      rideRequestId: this.passengerRideService.rideRequestId
    };

    sessionStorage.setItem("payment_state", JSON.stringify(paymentState));

    this.router.navigate(['passenger/payment'], {
      state: paymentState
    });
  }

  ngOnDestroy() {
    this.pinSub?.unsubscribe();
  }
  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRadians = (degrees: number) => degrees * Math.PI / 180;
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}