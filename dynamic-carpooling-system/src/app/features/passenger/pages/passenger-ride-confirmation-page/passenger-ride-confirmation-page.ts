import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { MapComponent } from '../../../../shared/components/map/map';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { SignalrService } from '../../../../core/services/signalr';
import { RideRequestService } from '../../../../core/services/ride-request-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-passenger-ride-confirmation',
  standalone: true,
  imports: [CommonModule, NavbarComponent, Footer, MapComponent],
  templateUrl: './passenger-ride-confirmation-page.html',
  styleUrl: './passenger-ride-confirmation-page.scss'
})
export class PassengerRideConfirmationPage implements OnInit, OnDestroy {

  pickup: any = null;
  destination: any = null;
  selectedDriver: any = null;

  private sub: Subscription | null = null;

  constructor(
    private router: Router,
    private passengerRideService: PassengerRideService,
    private signalrService: SignalrService,
    private rideRequestService: RideRequestService
  ) { }

  ngOnInit() {
    this.pickup = this.passengerRideService.pickup;
    this.destination = this.passengerRideService.destination;
    this.selectedDriver = this.passengerRideService.selectedDriver;

    if (!this.pickup || !this.selectedDriver) {
      this.router.navigate(['/passenger/landing']);
    }
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
    this.passengerRideService.pickup = null;
    this.passengerRideService.destination = null;
    this.passengerRideService.selectedDriver = null;
    this.passengerRideService.rideRequestId = null;
  }
}