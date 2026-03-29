import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgZone, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { MapComponent } from '../../../../shared/components/map/map';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { BookingService } from '../../../../core/services/booking-service';

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    Footer,
    MapComponent,
    MatSnackBarModule
  ],
  templateUrl: './trip-details.html',
  styleUrls: ['./trip-details.scss']
})
export class TripDetails implements OnInit, OnDestroy {

  rideData: any = null;
  hasReachedDestination = false;
  isCompleting = false;

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  constructor(
    public rideService: PassengerRideService,
    private bookingService: BookingService,
    private router: Router,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    const pickup = this.rideService.pickup;
    const destination = this.rideService.destination;
    const driver = this.rideService.selectedDriver;

    if (!pickup || !destination || !driver) {
      this.router.navigate(['/driver/landing']);
      return;
    }

    this.rideData = { pickup, destination, driver };

    if (isPlatformBrowser(this.platformId)) {
      const storedDistance = sessionStorage.getItem('distanceKm');
      if (storedDistance) {
        this.rideService.distanceKm = parseFloat(storedDistance);
      }
    }

    if (isPlatformBrowser(this.platformId)) {
      if (sessionStorage.getItem('trip_hasReachedDestination') === 'true') {
        this.hasReachedDestination = true;
      }
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
              sessionStorage.setItem('trip_hasReachedDestination', 'true');
            });
          }
        );
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.mapComponent) {
      this.mapComponent.stopDriverAnimation();
    }
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
        sessionStorage.removeItem('trip_hasReachedDestination');
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


}