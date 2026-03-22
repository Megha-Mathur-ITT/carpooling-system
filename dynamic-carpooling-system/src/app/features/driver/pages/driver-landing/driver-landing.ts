import { Component, ChangeDetectorRef, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapComponent } from '../../../../shared/components/map/map';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { Toggler } from '../../components/toggler/toggler';
import { RideForm } from '../../components/ride-form/ride-form';
import { RideRequestPopup } from '../../components/ride-request-popup/ride-request-popup';
import { SelectedLocation } from '../../../../shared/components/location-search/location-search';
import { SignalrService } from '../../../../core/services/signalr';
import { DriverActiveRidePanel } from '../../components/driver-active-ride-panel/driver-active-ride-panel';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-driver-landing',
  imports: [MapComponent, NavbarComponent, Footer, Toggler, RideForm, RideRequestPopup, DriverActiveRidePanel],
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
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.signalrService.connect();

    if(isPlatformBrowser(this.platformId)) {
      const savedDriverActiveSession = sessionStorage.getItem("driver_active_ride");

      if(savedDriverActiveSession) {
        this.activeRide = JSON.parse(savedDriverActiveSession);
        this.isOnline = true;

        this.cdr.detectChanges();
      }
    }

    this.sub = this.signalrService.rideRequested$.subscribe(request => {
      if (request) {
        this.incomingRequest = request;
        this.cdr.detectChanges();
      }
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

    if(isPlatformBrowser(this.platformId)) {
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
    this.cdr.detectChanges();
  }

  onDestinationSelected(location: SelectedLocation) {
    this.destination = location;
    this.cdr.detectChanges();
  }

  onSessionStarted() {
    this.isOnline = true;
    this.cdr.detectChanges();
  }

  onSessionStopped() {
    this.isOnline = false;
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