import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { SignalrService } from '../../../../core/services/signalr';
import { RideRequestService } from '../../../../core/services/ride-request-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-passenger-ride-confirmation',
  standalone: true,
  imports: [CommonModule, NavbarComponent, Footer],
  templateUrl: './passenger-ride-confirmation-page.html',
  styleUrl: './passenger-ride-confirmation-page.scss'
})
export class PassengerRideConfirmationPage implements OnInit, OnDestroy {

  pickup: any = null;
  destination: any = null;
  selectedDriver: any = null;
  rideStatus: 'waiting' | 'accepted' | 'rejected' = 'waiting';

  private sub!: Subscription;

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
      return;
    }

    this.signalrService.rideAccepted$.next(null);
    this.signalrService.rideRejected$.next(null);

    this.sub = this.signalrService.rideAccepted$.subscribe(response => {
      if (response) {
        this.rideStatus = 'accepted';
      }
    });

    this.sub.add(this.signalrService.rideRejected$.subscribe(response => {
      if (response) {
        this.rideStatus = 'rejected';
        setTimeout(() => {
          this.router.navigate(['/passenger/ride-selection']);
        }, 2000);
      }
    }));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  cancelRide() {
    const rideRequestId = this.passengerRideService.rideRequestId;

    if (rideRequestId) {
      this.rideRequestService.cancelRide(rideRequestId).subscribe({});
    }

    this.passengerRideService.pickup = null;
    this.passengerRideService.destination = null;
    this.passengerRideService.selectedDriver = null;
    this.passengerRideService.rideRequestId = null;
    this.router.navigate(['/passenger/landing']);
  }
}