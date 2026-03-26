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
import { DriverRideService } from '../../services/driver-ride-service';

@Component({
  selector: 'app-driver-landing',
  imports: [
    CommonModule,
    MapComponent,
    NavbarComponent,
    Footer,
    Toggler,
    RideForm,
    RideRequestPopup,
    DriverActiveRidePanel
  ],
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
    private router: Router,
    private rideService: DriverRideService
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.pickup = this.rideService.getPickup();
      this.destination = this.rideService.getDestination();
      this.isOnline = this.rideService.getIsOnline();
      this.activeRide = this.rideService.getActiveRide();

      if (!this.activeRide?.rideRequestId || !this.activeRide?.passengerName) {
        this.rideService.setActiveRide(null);
        this.activeRide = null;
      }

      this.cdr.detectChanges();
    }

    this.signalrService.connect();

    this.sub = this.signalrService.rideRequested$.subscribe(request => {
      if (!request) {
        if (this.incomingRequest) {
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
      pickupName: this.incomingRequest.pickup.name,
      destinationName: this.incomingRequest.destination.name,
    };

    this.rideService.setActiveRide(this.activeRide);
    this.incomingRequest = null;
    this.cdr.detectChanges();
  }

  onRequestRejected() {
    this.incomingRequest = null;
    this.cdr.detectChanges();
  }

  onCurrentLocationDetected(location: SelectedLocation) {
    this.pickup = location;
    this.rideService.setPickup(location);
    this.cdr.detectChanges();
  }

  onDestinationSelected(location: SelectedLocation) {
    this.destination = location;
    this.rideService.setDestination(location);
    this.cdr.detectChanges();
  }

  onSessionStarted() {
    this.isOnline = true;
    this.activeRide = null;

    this.rideService.setIsOnline(true);
    this.cdr.detectChanges();
  }

  onSessionStopped() {
    this.isOnline = false;

    this.rideService.setIsOnline(false);
    this.rideService.clearAll();
    this.pickup = null;
    this.destination = null;

    this.cdr.detectChanges();
  }

  onRideCompleted() {
    this.activeRide = null;
    this.isOnline = false;
    this.rideService.clearAll();
    this.pickup = null;
    this.destination = null;
    this.cdr.detectChanges();
  }

  onRideCancelled() {
    this.activeRide = null;
    this.rideService.setActiveRide(null);
    this.cdr.detectChanges();
  }
}