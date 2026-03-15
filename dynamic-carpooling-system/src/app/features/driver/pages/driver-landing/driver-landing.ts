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

@Component({
  selector: 'app-driver-landing',
  imports: [MapComponent, NavbarComponent, Footer, Toggler, RideForm, RideRequestPopup],
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
    private signalrService: SignalrService
  ) {}

  ngOnInit() {
  // TEMPORARY : FOR TESTING
  setTimeout(() => {
    this.incomingRequest = {
      requestId: 'test-123',
      passengerName: 'Test Passenger',
      pickup: 'Jaipur Railway Station',
      destination: 'Amber Fort'
    };
    this.cdr.detectChanges();
  }, 3000);

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