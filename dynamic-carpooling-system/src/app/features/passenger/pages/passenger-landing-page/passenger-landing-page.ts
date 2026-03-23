import { Component, OnInit, afterNextRender, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { MapComponent } from '../../../../shared/components/map/map';
import { LocationSearchComponent } from '../../../../shared/components/location-search/location-search';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { RideRequestService } from '../../../../core/services/ride-request-service';
import { getAddressDetails } from '../../../../shared/utils/locationUtil';

@Component({
  selector: 'app-passenger-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    Footer,
    MapComponent,
    LocationSearchComponent,
    MatSnackBarModule
  ],
  templateUrl: './passenger-landing-page.html',
  styleUrl: './passenger-landing-page.scss',
})
export class PassengerLandingPage implements OnInit {
  city: string = '';
  state: string = '';

  pickupLocation: any = null;
  destinationLocation: any = null;

  private ngZone = inject(NgZone);

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private passengerRideService: PassengerRideService,
    private rideRequestService: RideRequestService,
    private changeDetectionRef: ChangeDetectorRef
  ) {
    afterNextRender(() => {
      this.detectCurrentLocation();
    });
  }

  ngOnInit() {
    if (this.passengerRideService.pickup) {
      this.pickupLocation = this.passengerRideService.pickup;
      this.changeDetectionRef.detectChanges();
    }

    if (this.passengerRideService.destination) {
      this.destinationLocation = this.passengerRideService.destination;
      this.changeDetectionRef.detectChanges();
    }

    if (this.passengerRideService.city) {
      this.city = this.passengerRideService.city;
      this.changeDetectionRef.detectChanges();
    }

    if (this.passengerRideService.state) {
      this.state = this.passengerRideService.state;
      this.changeDetectionRef.detectChanges();
    }
  }

  detectCurrentLocation() {
    if (!navigator.geolocation) {
      return;
    }

    if (this.passengerRideService.pickup && this.city && this.state) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          this.pickupLocation = {
            latitude: latitude,
            longitude: longitude,
            name: ""
          };

          this.fetchLocation(latitude, longitude);
        });
      },
      () => {
        this.ngZone.run(() => {
          this.snackBar.open(
            "Location access denied. Please enter pickup manually.",
            'close',
            {
              duration: 4000,
              horizontalPosition: "center",
              verticalPosition: "top",
              panelClass: ['error-snackbar']
            }
          );
        });
      }
    );
  }

  async fetchLocation(latitude: number, longitude: number) {
    try {
      const { city, state, displayName } = await getAddressDetails({ latitude, longitude });

      this.ngZone.run(() => {
        this.city = city;
        this.state = state;
        this.passengerRideService.setCity(city);
        this.passengerRideService.setState(state);

        this.pickupLocation = {
          latitude: latitude,
          longitude: longitude,
          name: displayName,
        };
        this.passengerRideService.setPickup(this.pickupLocation);

        this.changeDetectionRef.detectChanges();
      })

    } catch (error) {
      this.ngZone.run(() => {
        this.city = '';
        this.state = '';

        this.snackBar.open(
          "Could not detect your location. Please enter pickup manually.",
          'close',
          {
            duration: 4000,
            horizontalPosition: "center",
            verticalPosition: "top",
            panelClass: ['error-snackbar']
          }
        );
      })
    }
  }

  goToRideSelectionPage() {
    if (!this.pickupLocation || !this.destinationLocation) {
      this.snackBar.open(
        "Please enter both pickup and destination.",
        'close',
        {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "top",
          panelClass: ['error-snackbar']
        }
      );

      return;
    }

    this.createRide();
  }

  createRide() {
    this.rideRequestService.createRide(this.pickupLocation, this.destinationLocation)
      .subscribe({
        next: (response) => {
          this.passengerRideService.rideRequestId = response.requestId;
          this.router.navigate(['/passenger/ride-selection']);
        },
        error: () => {
          this.snackBar.open(
            "Failed to create ride. Please try again.", 'close', {
            duration: 3000,
            horizontalPosition: "center",
            verticalPosition: "top",
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  setPickup(pickup: any) {
    this.pickupLocation = pickup;
    this.passengerRideService.setPickup(pickup);
    this.changeDetectionRef.detectChanges();
  }

  setDestination(destination: any) {
    this.destinationLocation = destination;
    this.passengerRideService.setDestination(destination);
    this.changeDetectionRef.detectChanges();
  }
}