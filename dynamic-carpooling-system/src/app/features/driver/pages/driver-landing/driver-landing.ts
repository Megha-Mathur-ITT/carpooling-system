import { Component, ChangeDetectorRef, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapComponent } from '../../../../shared/components/map/map';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { Toggler } from '../../components/toggler/toggler';
import { RideForm } from '../../components/ride-form/ride-form';
import { RideRequestPopup } from '../../components/ride-request-popup/ride-request-popup';
import { SelectedLocation } from '../../../../shared/components/location-search/location-search';
import { SignalrService } from '../../../../core/services/signalr';
import { DriverActiveRidePanel } from '../../components/driver-active-ride-panel/driver-active-ride-panel';

@Component({
  selector: 'app-driver-landing',
  imports: [CommonModule, MapComponent, NavbarComponent, Footer, Toggler, RideForm, RideRequestPopup, DriverActiveRidePanel],
  templateUrl: './driver-landing.html',
  styleUrl: './driver-landing.scss',
})
export class DriverLanding implements OnInit, OnDestroy {
  pickup: SelectedLocation | null = null;
  destination: SelectedLocation | null = null;
  isOnline = false;
  incomingRequest: any = null;
  activeRide: any = null;

  private sub!: Subscription;

  constructor(
    private cdr: ChangeDetectorRef,
    private signalrService: SignalrService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) { }


  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedPickup = sessionStorage.getItem('pickup');
      if (savedPickup) {
        this.pickup = JSON.parse(savedPickup);
      }

      const savedDestination = sessionStorage.getItem('destination');
      if (savedDestination) {
        this.destination = JSON.parse(savedDestination);
      }

      const savedOnline = sessionStorage.getItem('isOnline');
      this.isOnline = savedOnline === 'true';
    }

    this.signalrService.connect();

    if (isPlatformBrowser(this.platformId)) {
      const savedDriverActiveSession = sessionStorage.getItem("driver_active_ride");

      if (savedDriverActiveSession) {
        this.activeRide = JSON.parse(savedDriverActiveSession);
        this.isOnline = true;

        this.cdr.detectChanges();
      }
    }

    this.sub = this.signalrService.rideRequested$.subscribe(request => {
      if (request === null) {
        if (this.incomingRequest !== null) {
          this.incomingRequest = null;
          this.cdr.detectChanges();
        }

        return;
      }

      if (!request.pickupLat || !request.pickupLng || !request.destinationLat || !request.destinationLng) {
        console.warn('[DriverLanding] Ignoring malformed ride request payload:', request);
        return;
      }

      this.incomingRequest = {
        requestId: request.requestId ?? request.rideRequestId,
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

      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onRequestAccepted() {
    this.activeRide = {
      rideRequestId: this.incomingRequest.requestId,
      passengerName: this.incomingRequest.passengerName,
      passengerId: this.incomingRequest.passengerId,
      pickupName: this.incomingRequest.pickup,
      destinationName: this.incomingRequest.destination,
      fare: 200
    }

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem("driver_active_ride", JSON.stringify(this.activeRide));
    }

    this.incomingRequest = null;
    this.cdr.detectChanges();
  }

  onRequestRejected() {
    this.incomingRequest = null;
    this.cdr.detectChanges();
  }

  onCurrentLocationDetected(location: SelectedLocation) {
    this.pickup = location;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('pickup', JSON.stringify(location));
    }
    this.cdr.detectChanges();
  }

  onDestinationSelected(location: SelectedLocation) {
    this.destination = location;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('destination', JSON.stringify(location));
    }
    this.cdr.detectChanges();
  }

  onSessionStarted() {
    this.isOnline = true;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('isOnline', 'true');
    }
    this.cdr.detectChanges();
  }

  onSessionStopped() {
    this.isOnline = false;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('isOnline', 'false');
    }
    this.cdr.detectChanges();
  }

  onRideCompleted() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_active_ride');
      sessionStorage.removeItem('driver_payment_pending');
    }

    this.activeRide = null;
    this.isOnline = false;
    this.cdr.detectChanges();
  }

  onRideCancelled() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_active_ride');
      sessionStorage.removeItem('driver_payment_pending');
    }

    this.activeRide = null;
    this.cdr.detectChanges();
  }
}