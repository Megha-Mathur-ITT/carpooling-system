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

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    Footer,
    MapComponent,
    MatSnackBarModule,
    RideRequestPopup
  ],
  templateUrl: './trip-details.html',
  styleUrls: ['./trip-details.scss']
})
export class TripDetails implements OnInit, OnDestroy {

  rideData: any = null;
  hasReachedDestination = false;
  isCompleting = false;

  incomingRequest: RideRequest | null = null;
  currentDriverLat = 0;
  currentDriverLng = 0;

  private bookingId: string = '';
  private rideRequestId: string = '';
  private signalrSub!: Subscription;

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  constructor(
    public rideService: PassengerRideService,
    private bookingService: BookingService,
    private router: Router,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object,
    private signalrService: SignalrService,
    private driverRideService: DriverRideService
  ) { }

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

    const dist = this.calculateDistanceKm(pickup.latitude, pickup.longitude, destination.latitude, destination.longitude);
    this.rideService.distanceKm = Number(dist.toFixed(1));

    if (isPlatformBrowser(this.platformId)) {
      const activeRideRaw = sessionStorage.getItem('driver_active_ride');

      if (activeRideRaw) {
        const ar = JSON.parse(activeRideRaw);
        ar.distanceKm = this.rideService.distanceKm;
        sessionStorage.setItem('driver_active_ride', JSON.stringify(ar));
      }
    }
    setTimeout(() => {
      if (this.mapComponent) {
        this.mapComponent.startDestinationAnimation(
          this.rideData.pickup,
          this.rideData.destination,
          this.rideData.driver,
          () => {
            this.ngZone.run(() => {
              this.hasReachedDestination = true;
            });
          }
        );
      }
    }, 1000);

    this.signalrService.connect();

    this.signalrSub = this.signalrService.rideRequested$.subscribe(request => {
      if (!request) {
        this.incomingRequest = null;
        return;
      }

      if (!request.pickupLat || !request.pickupLng || !request.destinationLat || !request.destinationLng) {
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
          name: request.pickupName
        },
        destination: {
          latitude: request.destinationLat,
          longitude: request.destinationLng,
          name: request.destinationName
        }
      };

      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy() {
    this.signalrSub?.unsubscribe();
  }

  onRequestAccepted(): void {
    this.incomingRequest = null;
  }

  onRequestRejected(): void {
    this.incomingRequest = null;
  }

  completeRide() {
    if (!this.rideService.bookingId || this.isCompleting) {
      return;
    }

    this.isCompleting = true;
    this.changeDetectorRef.detectChanges();

    this.bookingService.completeBooking(this.rideService.bookingId, this.rideService.rideRequestId).subscribe({
      next: () => {
        this.snackBar.open('Ride completed successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/driver/landing']);
      },
      error: (err: any) => {
        console.error('Complete ride error:', err);
        this.isCompleting = false;
        this.snackBar.open('Failed to complete ride. Try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
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