import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { MapComponent } from '../../../../shared/components/map/map';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { RideSummary } from '../../components/common-components/ride-summary/ride-summary';
import { AuthService } from '../../../../core/services/auth-service';
import { RideStatus } from '../../components/ride-confirmation-page/ride-status/ride-status';
import { reverseGeocode, trimLocation } from '../../../../shared/utils/locationUtil';

@Component({
  selector: 'app-passenger-ride-confirmation',
  standalone: true,
  imports: [CommonModule, NavbarComponent, Footer, MapComponent, RideSummary, RideStatus],
  templateUrl: './passenger-ride-confirmation-page.html',
  styleUrl: './passenger-ride-confirmation-page.scss'
})
export class PassengerRideConfirmationPage implements OnInit {
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

  constructor(
    private router: Router,
    private passengerRideService: PassengerRideService,
    private changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    this.passengerPickup = this.passengerRideService.pickup;
    this.passengerDestination = this.passengerRideService.destination;

    this.selectedDriver = this.passengerRideService.selectedDriver;
  }

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  async ngOnInit() {
    if (!this.passengerPickup || !this.selectedDriver) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    const address = await reverseGeocode({
      latitude: this.selectedDriver.latitude,
      longitude: this.selectedDriver.longitude
    });

    this.ngZone.run(() => {
      this.driverLocation = {
        latitude: this.selectedDriver.latitude,
        longitude: this.selectedDriver.longitude,
        name: this.selectedDriver.driverName,
        popupLabel: `<b>Driver start point:</b> ${address}`
      };

      this.changeDetectorRef.detectChanges();
    });

    this.changeDetectorRef.detectChanges();

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

    this.loadPin();
  }

  private clearRideState(): void {
    this.passengerRideService.setPickup(null);
    this.passengerRideService.setDestination(null);

    this.passengerRideService.selectedDriver = null;
    this.passengerRideService.rideRequestId = null;
  }

  startDestinationRide(): void {
    this.isRideStarted = true;
    this.isDriverArrived = false;

    this.changeDetectorRef.detectChanges();

    if (this.mapComponent) {
      this.mapComponent.startDestinationAnimation(() => {
        this.isRideStarted = false;
        this.isReachedDestination = true;
        this.changeDetectorRef.markForCheck();
      }
      );
    }
  }

  private loadPin(): void {
    this.authService.getMyPin().subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.passengerPin = response.pin;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {

      }
    });
  }

  goToPayment() {
    this.router.navigate(['passenger/payment'], {
      state: {
        fare: 200,
        distanceKm: this.distanceKm,
        driver: this.selectedDriver,  
        pickup: this.passengerPickup,
        destination: this.passengerDestination
      }
    });
  }
}