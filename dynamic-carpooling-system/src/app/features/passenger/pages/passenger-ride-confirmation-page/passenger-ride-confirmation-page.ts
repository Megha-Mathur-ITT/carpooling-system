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

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface Driver {
  driverId: string;
  driverName: string;
  vehicleName: string;
}

@Component({
  selector: 'app-passenger-ride-confirmation',
  standalone: true,
  imports: [CommonModule, NavbarComponent, Footer, MapComponent],
  templateUrl: './passenger-ride-confirmation-page.html',
  styleUrl: './passenger-ride-confirmation-page.scss'
})
export class PassengerRideConfirmationPage implements OnInit, OnDestroy {

  pickup: Location | null = null;
  destination: Location | null = null;
  selectedDriver: Driver | null = null;
  rideStatus: 'waiting' | 'accepted' | 'rejected' = 'waiting';

  private sub: Subscription | null = null;
  private redirectTimeout: any = null;

  constructor(
    private router: Router,
    private passengerRideService: PassengerRideService,
    private signalrService: SignalrService,
    private rideRequestService: RideRequestService
  ) {}

  ngOnInit() {
    this.pickup = this.passengerRideService.pickup;
    this.destination = this.passengerRideService.destination;
    this.selectedDriver = this.passengerRideService.selectedDriver;

    if (!this.pickup || !this.selectedDriver) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    this.signalrService.resetRideState();

    this.sub = this.signalrService.rideAccepted$.subscribe(response => {
      if (response) {
        this.rideStatus = 'accepted';
      }
    });

    this.sub.add(this.signalrService.rideRejected$.subscribe(response => {
      if (response) {
        this.rideStatus = 'rejected';
        this.redirectTimeout = setTimeout(() => {
          this.router.navigate(['/passenger/ride-selection']);
        }, 2000);
      }
    }));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    clearTimeout(this.redirectTimeout);
  }

  private clearRideState(): void {
    this.passengerRideService.pickup = null;
    this.passengerRideService.destination = null;
    this.passengerRideService.selectedDriver = null;
    this.passengerRideService.rideRequestId = null;
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
        error: (err) => {
          console.error('Failed to cancel ride:', err);
        }
      });
    } else {
      this.clearRideState();
      this.router.navigate(['/passenger/landing']);
    }
  }
}