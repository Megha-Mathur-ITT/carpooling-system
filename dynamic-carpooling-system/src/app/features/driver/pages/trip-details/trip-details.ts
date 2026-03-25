import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgZone, ChangeDetectorRef } from '@angular/core';
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
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
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

    setTimeout(() => {
      if (this.mapComponent) {
        this.mapComponent.startDestinationAnimation(
          this.rideData.pickup,
          this.rideData.destination,
          this.rideData.driver,
          () => {
            this.ngZone.run(() => {
              this.hasReachedDestination = true;
              this.router.navigate(['/driver/trip-details']);
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

    this.bookingService.completeBooking(this.rideService.bookingId).subscribe({
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
}