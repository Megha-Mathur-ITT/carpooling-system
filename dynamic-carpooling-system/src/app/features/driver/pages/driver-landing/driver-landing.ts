import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
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
    private signalrService: SignalrService
  ) { }

  ngOnInit() {
    this.signalrService.connect();

    this.sub = this.signalrService.rideRequested$.subscribe(request => {
      if (request) {
        console.log("Driver received request:", request);
        this.incomingRequest = request;
        console.log("incomingRequest in DL: ", this.incomingRequest);
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

    console.log("activeRide: ", this.activeRide);

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
    this.activeRide = null;
    this.isOnline = false;
    this.cdr.detectChanges();
  }

  onRideCancelled() {
    this.activeRide = null;
    this.cdr.detectChanges();
  }
}