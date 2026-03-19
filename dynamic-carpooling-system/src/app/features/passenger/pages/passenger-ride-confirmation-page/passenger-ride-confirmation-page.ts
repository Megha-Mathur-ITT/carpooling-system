import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { MapComponent } from '../../../../shared/components/map/map';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { SignalrService } from '../../../../core/services/signalr';
import { RideRequestService } from '../../../../core/services/ride-request-service';
import { Subscription } from 'rxjs';
import { RideSummary } from '../../components/ride-selection-page/ride-summary/ride-summary';

@Component({
  selector: 'app-passenger-ride-confirmation',
  standalone: true,
  imports: [CommonModule, NavbarComponent, Footer, MapComponent, RideSummary],
  templateUrl: './passenger-ride-confirmation-page.html',
  styleUrl: './passenger-ride-confirmation-page.scss'
})
export class PassengerRideConfirmationPage implements OnInit, OnDestroy {
  passengerPickup: any = null;
  passengerDestination: any = null;
  selectedDriver: any = null;
  driverLocation: any = null;

  private sub: Subscription | null = null;

  constructor(
    private router: Router,
    private passengerRideService: PassengerRideService,
    private signalrService: SignalrService,
    private rideRequestService: RideRequestService,
  ) {
    this.passengerPickup = this.passengerRideService.pickup;
    this.passengerDestination = this.passengerRideService.destination;

    this.selectedDriver = this.passengerRideService.selectedDriver;
    this.driverLocation = {
      latitude: this.selectedDriver?.latitude,
      longitude: this.selectedDriver?.longitude,
      name: this.selectedDriver?.driverName
    };
  }

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  ngOnInit() {
    if (!this.passengerPickup || !this.selectedDriver) {
      this.router.navigate(['/passenger/landing']);
    }

    setTimeout(() => {
      if (this.mapComponent && this.selectedDriver && this.passengerPickup) {
        this.mapComponent.startDriverAnimation(
          this.selectedDriver.latitude,
          this.selectedDriver.longitude,
          this.passengerPickup.latitude,
          this.passengerPickup.longitude,
          this.passengerDestination.latitude,
          this.passengerDestination.longitude,
        );
      }
    }, 1500);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  cancelRide() {
    const rideRequestId = this.passengerRideService.rideRequestId;

    if (rideRequestId) {
      this.rideRequestService.cancelRide(rideRequestId).subscribe({
        next: () => {
          this.signalrService.notifyCancelRide(rideRequestId);
          this.clearRideState();
          this.router.navigate(['/passenger/landing']);
        },
        error: () => {
          this.clearRideState();
          this.router.navigate(['/passenger/landing']);
        }
      });
    } else {
      this.clearRideState();
      this.router.navigate(['/passenger/landing']);
    }
  }

  private clearRideState(): void {
    this.passengerRideService.setPickup(null);
    this.passengerRideService.setDestination(null);
    this.passengerRideService.selectedDriver = null;
    this.passengerRideService.rideRequestId = null;
  }
}