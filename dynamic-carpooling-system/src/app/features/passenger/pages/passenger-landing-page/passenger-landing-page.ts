import { Component, OnInit, afterNextRender, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LocationTrackingService } from '../../../../core/services/location-tracking-service';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { MapComponent } from '../../../../shared/components/map/map';
import { LocationSearchComponent } from '../../../../shared/components/location-search/location-search';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { RideRequestService } from '../../../../core/services/ride-request-service';

@Component({
  selector: 'app-passenger-landing-page',
  imports: [CommonModule, NavbarComponent, Footer, MapComponent, LocationSearchComponent, MatSnackBarModule],
  templateUrl: './passenger-landing-page.html',
  styleUrl: './passenger-landing-page.scss',
})
export class PassengerLandingPage implements OnInit {
  city: string = '';
  state: string = '';

  pickupLocation: any;
  destinationLocation: any;

  constructor(
    private router: Router,
    private locationTrackingService: LocationTrackingService,
    private changeDetectorRef: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private passengerRideService: PassengerRideService,
    private rideRequestService: RideRequestService
  ) {
    afterNextRender(() => {
      this.detectCurrentLocation();
    });
  }

  ngOnInit() {
    if (this.passengerRideService.pickup) {
      this.pickupLocation = this.passengerRideService.pickup;
    }

    if (this.passengerRideService.destination) {
      this.destinationLocation = this.passengerRideService.destination;
    }
  }

  detectCurrentLocation() {
    if (!navigator.geolocation) {
      return;
    }

    if (this.passengerRideService.pickup) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      this.pickupLocation = {
        latitude: latitude,
        longitude: longitude,
        name: ""
      };

      this.fetchLocation(latitude, longitude);
    })
  }

  fetchLocation(latitude: number, longitude: number) {
    this.locationTrackingService.getLocationFromCoordinates(latitude, longitude)
      .subscribe(response => {

        this.city = response.location.city;
        this.state = response.location.state;

        this.pickupLocation = {
          latitude: latitude,
          longitude: longitude,
          name: `${this.city}, ${this.state}`,
        };

        this.passengerRideService.pickup = this.pickupLocation;

        this.changeDetectorRef.markForCheck();
      });
  }

  goToRideSelectionPage() {
    if (!this.pickupLocation || !this.destinationLocation) {
      this.snackBar.open("Please enter both pickup and destination.", 'close', {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "top",
        panelClass: ['error-snackbar']
      });

      return;
    }

    this.rideRequestService.createRide(this.pickupLocation, this.destinationLocation)
      .subscribe({
        next: (response) => {
          console.log('Ride created:', response);

          this.passengerRideService.rideRequestId = response.rideRequestId;
          this.router.navigate(['/passenger/ride-selection']);
        },
        error: () => {
          this.snackBar.open("Failed to create ride. Please try again.", 'close', {
            duration: 3000,
            horizontalPosition: "center",
            verticalPosition: "top",
            panelClass: ['error-snackbar']
          });
        }
      });
  } 

  setPickup(location: any) {
    this.pickupLocation = location;
    this.passengerRideService.pickup = location;
  }

  setDestination(location: any) {
    this.destinationLocation = location;
    this.passengerRideService.destination = location;
  }
}
