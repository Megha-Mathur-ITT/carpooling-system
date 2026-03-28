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
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
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
  incomingRequest: any = null;
  pendingRequests: RideRequest[] = [];

  currentDriverLat = 0;
  currentDriverLng = 0;

  private sub!: Subscription;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private signalrService: SignalrService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private rideService: DriverRideService,
    public passengerRideService: PassengerRideService
  ) { }
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.pickup = this.rideService.getPickup();
      this.destination = this.rideService.getDestination();
      this.isOnline = this.rideService.getIsOnline();
 
      const savedDriverActiveSession = sessionStorage.getItem('driver_active_ride');
      if (savedDriverActiveSession) {
        const parsed = JSON.parse(savedDriverActiveSession);
 
        if (parsed?.rideRequestId && parsed?.passengerName) {
          this.activeRide = parsed;
          this.isOnline = true;
        } else {
          sessionStorage.removeItem('driver_active_ride');
        }
 
        this.changeDetectorRef.detectChanges();
      }
      this.activeRide = this.rideService.getActiveRide();

      if (!this.activeRide?.rideRequestId || !this.activeRide?.passengerName) {
        this.rideService.setActiveRide(null);
        this.activeRide = null;
      } else {
        this.isOnline = true;
      }

      this.changeDetectorRef.detectChanges();
    }
 
    this.signalrService.connect();
 
    this.sub = this.signalrService.rideRequested$.subscribe(request => {
      if (!request) {
        if (this.incomingRequest !== null) {
          this.incomingRequest = null;
        }
        this.changeDetectorRef.detectChanges();
        return;
      }
      if (!request.pickupLat || !request.pickupLng || !request.destinationLat || !request.destinationLng) {
        console.warn('[DriverLanding] Ignoring malformed ride request payload:', request);
        return;
      }
    
      this.incomingRequest = {
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
      const incoming: RideRequest = this.incomingRequest;

      const alreadyExists = this.pendingRequests.some(r => r.requestId === incoming.requestId);
      if (!alreadyExists) {
        this.pendingRequests = [...this.pendingRequests, incoming];
      }

      this.changeDetectorRef.detectChanges();
    });
  }
 
  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
 
  onRequestAccepted() {
    this.activeRide = {
      rideRequestId: this.incomingRequest?.requestId || this.pendingRequests[0]?.requestId,
      passengerName: this.incomingRequest?.passengerName || this.pendingRequests[0]?.passengerName,
      passengerId: this.incomingRequest?.passengerId || this.pendingRequests[0]?.passengerId,
      pickupName: this.incomingRequest?.pickup?.name || this.pendingRequests[0]?.pickup?.name,
      destinationName: this.incomingRequest?.destination?.name || this.pendingRequests[0]?.destination?.name,
      fare: this.passengerRideService.fare || 0,
      distanceKm: this.passengerRideService.distanceKm || 0
    };
 
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('driver_active_ride', JSON.stringify(this.activeRide));
    }
 
    this.incomingRequest = null;
    this.pendingRequests = [];
    this.changeDetectorRef.detectChanges();
  }
 
  onRequestRejected() {
    this.incomingRequest = null;
    this.changeDetectorRef.detectChanges();
  }
 
  onCurrentLocationDetected(location: SelectedLocation) {
    this.pickup = location;
    if (this.pendingRequests.length > 0) {
      this.pendingRequests = this.pendingRequests.slice(1);
    }
    
    this.changeDetectorRef.detectChanges();
  }

  onAllRejected() {
    this.pendingRequests = [];
    this.changeDetectorRef.detectChanges();
  }
 
  onCurrentLocationDetected(location: SelectedLocation) {
    this.pickup = location;
    this.currentDriverLat = location.latitude;
    this.currentDriverLng = location.longitude;
    this.rideService.setPickup(location);
    this.changeDetectorRef.detectChanges();
  }
 
  onDestinationSelected(location: SelectedLocation) {
    this.destination = location;
    this.rideService.setDestination(location);
    this.changeDetectorRef.detectChanges();
  }
 
  onSessionStarted() {
    this.isOnline = true;
    this.activeRide = null;
    this.rideService.setIsOnline(true);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_active_ride');
    }
    this.changeDetectorRef.detectChanges();
  }
 
  onSessionStopped() {
    this.isOnline = false;
    this.pendingRequests = [];
    this.rideService.setIsOnline(false);
    this.rideService.clearAll();
    this.pickup = null;
    this.destination = null;
    this.changeDetectorRef.detectChanges();
  }
 
  onRideCompleted() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_active_ride');
      sessionStorage.removeItem('driver_payment_pending');
    }
 
    this.activeRide = null;
    this.isOnline = false;
    this.rideService.clearAll();
    this.pendingRequests = [];
    this.rideService.clearAll();
    this.pickup = null;
    this.destination = null;
    this.changeDetectorRef.detectChanges();
  }
 
  onRideCancelled() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_active_ride');
      sessionStorage.removeItem('driver_payment_pending');
    }
 
    this.activeRide = null;
    this.rideService.setActiveRide(null);
    this.changeDetectorRef.detectChanges();
  }
}
 