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
import { RideRequestPanel } from '../../components/ride-request-panel/ride-request-panel';
import { SelectedLocation } from '../../../../shared/components/location-search/location-search';
import { SignalrService } from '../../../../core/services/signalr';
import { DriverActiveRidePanel } from '../../components/driver-active-ride-panel/driver-active-ride-panel';
import { DriverRideService } from '../../services/driver-ride-service';
import { RideRequest } from '../../services/ride-session';

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
    RideRequestPanel,
    DriverActiveRidePanel
  ],
  templateUrl: './driver-landing.html',
  styleUrl: './driver-landing.scss',
})
export class DriverLanding implements OnInit, OnDestroy {

  pickup: SelectedLocation | null = null;
  destination: SelectedLocation | null = null;
  isOnline = false;
  activeRide: any = null;

  pendingRequests: RideRequest[] = [];

  currentDriverLat = 0;
  currentDriverLng = 0;

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
        this.cdr.detectChanges();
        return;
      }

      if (!request.pickupLat || !request.pickupLng || !request.destinationLat || !request.destinationLng) {
        console.warn('[DriverLanding] Ignoring malformed ride request payload:', request);
        return;
      }

      const incoming: RideRequest = {
        requestId: request.requestId ?? request.rideRequestId,
        sessionId: request.sessionId,
        passengerName: request.passengerName,
        passengerId: request.passengerId,
        requestedAt: request.requestedAt ?? new Date().toISOString(),
        rideRequestStatus: request.rideRequestStatus ?? 'Pending',
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

      const alreadyExists = this.pendingRequests.some(r => r.requestId === incoming.requestId);
      if (!alreadyExists) {
        this.pendingRequests = [...this.pendingRequests, incoming];
      }

      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onRequestAccepted() {
    this.pendingRequests = [];
    this.cdr.detectChanges();
  }

  onRequestRejected() {
    if (this.pendingRequests.length > 0) {
      this.pendingRequests = this.pendingRequests.slice(1);
    }
    this.cdr.detectChanges();
  }

  onAllRejected() {
    this.pendingRequests = [];
    this.cdr.detectChanges();
  }

  onCurrentLocationDetected(location: SelectedLocation) {
    this.pickup = location;
    this.currentDriverLat = location.latitude;
    this.currentDriverLng = location.longitude;
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
    this.pendingRequests = [];
    this.rideService.setIsOnline(false);
    this.rideService.clearAll();
    this.pickup = null;
    this.destination = null;
    this.cdr.detectChanges();
  }

  onRideCompleted() {
    this.activeRide = null;
    this.isOnline = false;
    this.pendingRequests = [];
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