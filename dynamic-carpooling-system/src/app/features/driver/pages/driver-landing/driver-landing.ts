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

  constructor(
    private cdr: ChangeDetectorRef,
    private signalrService: SignalrService,
    private router: Router
  ) {}

  ngOnInit() {
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
}