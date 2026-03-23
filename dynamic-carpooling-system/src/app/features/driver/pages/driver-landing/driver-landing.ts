import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { MapComponent } from '../../../../shared/components/map/map';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { Toggler } from '../../components/toggler/toggler';
import { RideForm } from '../../components/ride-form/ride-form';
import { RideRequestPopup } from '../../components/ride-request-popup/ride-request-popup';
import { SelectedLocation } from '../../../../shared/components/location-search/location-search';
import { SignalrService } from '../../../../core/services/signalr';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

@Component({
  selector: 'app-driver-landing',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    NavbarComponent,
    Footer,
    Toggler,
    RideForm,
    RideRequestPopup
  ],
  templateUrl: './driver-landing.html',
  styleUrl: './driver-landing.scss',
})
export class DriverLanding implements OnInit, OnDestroy {

  pickup: SelectedLocation | null = null;
  destination: SelectedLocation | null = null;
  isOnline = false;
  incomingRequest: any = null;

  private sub!: Subscription;
  private platformId = inject(PLATFORM_ID);

  constructor(
    private cdr: ChangeDetectorRef,
    private signalrService: SignalrService,
    private router: Router
  ) {}

  
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

    this.sub = this.signalrService.rideRequested$.subscribe(request => {
      if (!request) return;

      const incomingId = request.rideRequestId ?? request.requestId;
      const existingId = this.incomingRequest?.requestId ?? this.incomingRequest?.rideRequestId;

      if (incomingId && existingId && incomingId === existingId) {
        return;
      }

      this.incomingRequest = {
        requestId: incomingId,
        sessionId: request.sessionId,
        passengerName: request.passengerName,
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

      console.log('Driver received request:', this.incomingRequest);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onRequestAccepted() {
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
}