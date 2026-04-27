import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgZone, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { MapComponent } from '../../../../shared/components/map/map';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { BookingService } from '../../../../core/services/booking-service';
import { SignalrService } from '../../../../core/services/signalr';
import { DriverRideService } from '../../services/driver-ride-service';
import { RideRequest } from '../../services/ride-session';
import { RideRequestPopup } from '../../components/ride-request-popup/ride-request-popup';
import { RidePinVerify } from '../../components/ride-pin-verify/ride-pin-verify';

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    Footer,
    MapComponent,
    MatSnackBarModule,
    RideRequestPopup,
    RidePinVerify,
  ],
  templateUrl: './trip-details.html',
  styleUrls: ['./trip-details.scss'],
})
export class TripDetails implements OnInit, OnDestroy {
  rideData: any = null;
  hasReachedDestination = false;
  isCompleting = false;
  showPinVerification = false;
  isPickingUpPassenger = false;
  boardedPassengers: {
    name: string;
    fare: number;
    passengerId: string;
    pickupName: string;
    destinationName: string;
    distanceKm: number;
  }[] = [];
  private currentMidTripPickup: any = null;

  incomingRequest: RideRequest | null = null;
  currentDriverLatitude = 0;
  currentDriverLongitude = 0;
  private lastDriverPosition: { latitude: number; longitude: number } | null = null;

  private bookingId: string = '';
  private rideRequestId: string = '';
  private signalrSub!: Subscription;
  private paymentSub!: Subscription;

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  constructor(
    public rideService: PassengerRideService,
    private bookingService: BookingService,
    private router: Router,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object,
    private signalrService: SignalrService,
    private driverRideService: DriverRideService,
  ) {}

  ngOnInit() {
    const pickup = this.rideService.pickup;
    const destination = this.rideService.destination;
    const driver = this.rideService.selectedDriver;

    this.bookingId = this.rideService.bookingId;
    this.rideRequestId = this.rideService.rideRequestId;

    if (!pickup || !destination || !driver) {
      this.router.navigate(['/driver/landing']);
      return;
    }

    this.rideData = { pickup, destination, driver };

    const savedBoardedPassengers = sessionStorage.getItem('boardedPassengers');
    if (savedBoardedPassengers) {
      this.boardedPassengers = JSON.parse(savedBoardedPassengers);
    }

    this.lastDriverPosition = { latitude: driver.latitude, longitude: driver.longitude };
    this.currentDriverLatitude = driver.latitude;
    this.currentDriverLongitude = driver.longitude;

    if (isPlatformBrowser(this.platformId)) {
      const activeRideRaw = sessionStorage.getItem('driver_active_ride');

      if (activeRideRaw) {
        const activeRide = JSON.parse(activeRideRaw);
        const dist = this.calculateDistanceKm(
          pickup.latitude,
          pickup.longitude,
          destination.latitude,
          destination.longitude,
        );

        this.rideService.distanceKm = Number(dist.toFixed(1));
        sessionStorage.setItem('driver_active_ride', JSON.stringify(activeRide));
      }
    }

    setTimeout(() => {
      if (!this.mapComponent) {
        return;
      }

      if (this.rideService.pickupCompleted) {
        this.startDestinationPhase();
      } else {
        this.startPickupPhase();
      }
    }, 1000);

    this.signalrSub = this.signalrService.rideRequested$.subscribe((request) => {
      if (!request) {
        this.incomingRequest = null;
        return;
      }

      if (
        !request.pickupLat ||
        !request.pickupLng ||
        !request.destinationLat ||
        !request.destinationLng
      ) {
        return;
      }

      this.incomingRequest = {
        requestId: request.rideRequestId,
        sessionId: request.sessionId,
        passengerName: request.passengerName,
        passengerId: request.passengerId,
        pickup: {
          latitude: request.pickupLat,
          longitude: request.pickupLng,
          name: request.pickupName,
        },
        destination: {
          latitude: request.destinationLat,
          longitude: request.destinationLng,
          name: request.destinationName,
        },
      };

      this.changeDetectorRef.detectChanges();
      this.listenForPayments();
    });
  }

  private listenForPayments(): void {
    this.paymentSub = this.signalrService.passengerPaid$.subscribe((data) => {
      if (!data) {
        return;
      }

      const existing: any[] = JSON.parse(sessionStorage.getItem('driver_pending_payments') || '[]');

      const alreadyExists = existing.some(
        (passenger) => passenger.rideRequestId === data.rideRequestId,
      );
      if (!alreadyExists) {
        const boardedPassengers: any[] = JSON.parse(
          sessionStorage.getItem('boardedPassengers') || '[]',
        );

        const matched = boardedPassengers.find(
          (passenger: any) => passenger.passengerId === data.passengerId,
        );

        existing.push({
          rideRequestId: data.rideRequestId,
          passengerId: data.passengerId,
          passengerName: matched?.name ?? 'Passenger',
          fare: matched?.fare ?? 0,
          distanceKm: matched?.distanceKm ?? 0,
          pickupName: matched?.pickupName ?? '',
          destinationName: matched?.destinationName ?? '',
        });

        sessionStorage.setItem('driver_pending_payments', JSON.stringify(existing));
      }
    });
  }

  // PHASE 1: Driver to Passenger Pickup
  private startPickupPhase(): void {
    const currentPassengerId = this.rideService.passengerId;

    this.mapComponent.onDriverReachedPickup(() => {
      this.ngZone.run(() => {
        this.showPinVerification = true;
        this.signalrService.notifyPassengerDriverArrived([currentPassengerId]);

        this.signalrService.syncLocation(
          [currentPassengerId],
          this.rideData.pickup.latitude,
          this.rideData.pickup.longitude,
        );

        this.changeDetectorRef.detectChanges();
      });
    });

    this.mapComponent.startDriverAnimation(
      this.rideData.driver,
      this.rideData.pickup,
      this.rideData.destination,
      this.rideData.pickup?.name,
      this.rideData.destination?.name,
      () => {},
      (currentPosition: any) => {
        this.trackAndSync(currentPosition);
      },
    );
  }

  // PHASE 2: Pickup to Destination
  private startDestinationPhase(): void {
    const resumeFrom = this.lastDriverPosition ?? this.rideData.driver;

    const allPassengerIds = this.rideService.passengerIds;
    if (allPassengerIds.length > 0 && resumeFrom) {
      this.signalrService.syncLocation(allPassengerIds, resumeFrom.latitude, resumeFrom.longitude);
    }

    this.mapComponent.startDestinationAnimation(
      this.rideData.pickup,
      this.rideData.destination,
      resumeFrom,
      () => {
        this.ngZone.run(() => {
          this.hasReachedDestination = true;
          this.changeDetectorRef.detectChanges();

          const allPassengerIds = this.rideService.passengerIds;
          if (allPassengerIds.length > 0) {
            this.signalrService.notifyPassengersRideReachedDestination(allPassengerIds);
          }
        });
      },
      (currentPosition: any) => {
        this.trackAndSync(currentPosition);
      },
    );
  }

  // PIN verified for 1st passenger
  onPinVerified(pin: string): void {
    this.bookingService
      .verifyPin(this.rideService.bookingId, this.rideService.rideRequestId, pin)
      .subscribe({
        next: () => {
          this.signalrService.notifyPassengerPinVerified(this.rideService.passengerId, true);
          this.showPinVerification = false;

          this.boardedPassengers.push({
            name: this.rideService.passengerName,
            fare: this.rideService.fare,
            passengerId: this.rideService.passengerId,
            pickupName: this.rideService.pickup?.name ?? '',
            destinationName: this.rideService.destination?.name ?? '',
            distanceKm: this.rideService.distanceKm,
          } as any);

          sessionStorage.setItem('boardedPassengers', JSON.stringify(this.boardedPassengers));

          this.rideService.setPickupCompleted(true);
          this.mapComponent.stopDriverAnimation();

          if (this.isPickingUpPassenger && this.currentMidTripPickup) {
            this.rideData = {
              ...this.rideData,
              pickup: this.currentMidTripPickup,
            };
          }

          this.isPickingUpPassenger = false;
          this.changeDetectorRef.detectChanges();

          const boardedIds = this.boardedPassengers
            .map((passenger) => passenger.passengerId)
            .filter((id) => id !== this.rideService.passengerId);

          if (boardedIds.length > 0) {
            this.signalrService.notifyPassengerRideResumed(boardedIds); 
          }

          setTimeout(() => this.startDestinationPhase(), 400);
        },
        error: (err: any) => {
          console.error('PIN verify failed:', err);
          this.signalrService.notifyPassengerPinVerified(this.rideService.passengerId, false);
        },
      });
  }

  // Mid-trip 2nd passenger accepted
  onRequestAccepted(): void {
    this.incomingRequest = null;
    this.isPickingUpPassenger = true;

    // Pause current destination animation
    this.mapComponent.stopDriverAnimation();
    const newPassengerId = this.rideService.passengerId;

    const boardedIds = this.boardedPassengers
      .map((_, i) => this.rideService.passengerIds[i])
      .filter(Boolean);

    if (boardedIds.length > 0) {
      this.signalrService.notifyPassengerRideOnHold(boardedIds);
    }

    const currentPosition = this.lastDriverPosition ?? this.rideData.driver;
    const newPickup = { ...this.rideService.pickup };
    this.currentMidTripPickup = newPickup;

    setTimeout(() => {
      this.mapComponent.onDriverReachedPickup(() => {
        this.ngZone.run(() => {
          this.showPinVerification = true;
          this.signalrService.notifyPassengerDriverArrived([newPassengerId]);

          this.signalrService.syncLocation(
            this.rideService.passengerIds,
            newPickup.latitude,
            newPickup.longitude,
          );

          this.changeDetectorRef.detectChanges();
        });
      });

      this.mapComponent.startDriverAnimation(
        currentPosition,
        newPickup,
        this.rideData.destination,
        newPickup.name,
        this.rideData.destination.name,
        () => {},
        (position: any) => {
          this.trackAndSync(position);
        },
      );
    }, 300);
  }

  private trackAndSync(currentPosition: any): void {
    if (!currentPosition?.latitude) {
      return;
    }

    this.lastDriverPosition = {
      latitude: currentPosition.latitude,
      longitude: currentPosition.longitude,
    };
    this.currentDriverLatitude = currentPosition.latitude;
    this.currentDriverLongitude = currentPosition.longitude;

    if (this.mapComponent) {
      if (!this.rideService.pickupCompleted || this.isPickingUpPassenger) {
        this.mapComponent.fitToShowDriverAndPickup(
          currentPosition.latitude,
          currentPosition.longitude,
          this.rideData.pickup.latitude,
          this.rideData.pickup.longitude,
        );
      } else {
        this.mapComponent.fitToShowDriverAndPickup(
          currentPosition.latitude,
          currentPosition.longitude,
          this.rideData.destination.latitude,
          this.rideData.destination.longitude,
        );
      }
    }

    const allPassengerIds = this.rideService.passengerIds;

    if (allPassengerIds.length > 0) {
      this.signalrService.syncLocation(
        allPassengerIds,
        currentPosition.latitude,
        currentPosition.longitude,
      );
    }
  }

  onRequestRejected(): void {
    this.incomingRequest = null;
  }

  // Complete ride
  completeRide() {
    if (!this.rideService.bookingId || this.isCompleting) {
      return;
    }

    this.isCompleting = true;
    this.changeDetectorRef.detectChanges();

    sessionStorage.setItem('driver_expected_payments', this.boardedPassengers.length.toString());

    this.bookingService
      .completeBooking(this.rideService.bookingId, this.rideService.rideRequestId)
      .subscribe({
        next: () => {
          this.snackBar.open('Ride completed successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });

          const pendingPayments = JSON.parse(
            sessionStorage.getItem('driver_pending_payments') || '[]',
          );

          this.router.navigate(['/driver/landing']);
        },
        error: (err: any) => {
          console.error('Complete ride error:', err);
          this.isCompleting = false;
          this.snackBar.open('Failed to complete ride. Try again.', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  ngOnDestroy() {
    this.signalrSub?.unsubscribe();
    this.paymentSub?.unsubscribe();
  }

  get totalFare(): number {
    return this.boardedPassengers.reduce((sum, passenger) => sum + passenger.fare, 0);
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRadians = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
