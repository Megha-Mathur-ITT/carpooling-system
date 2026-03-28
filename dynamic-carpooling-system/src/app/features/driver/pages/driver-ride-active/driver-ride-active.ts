import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { MapComponent } from '../../../../shared/components/map/map';
import { PassengerDetails } from '../../components/passenger-details/passenger-details';
import { RidePinVerify } from '../../components/ride-pin-verify/ride-pin-verify';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { BookingService } from '../../../../core/services/booking-service';
import { SignalrService } from '../../../../core/services/signalr';
import { DriverRideService } from '../../services/driver-ride-service';
@Component({
  selector: 'app-driver-ride-active',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    Footer,
    MapComponent,
    PassengerDetails,
    RidePinVerify
  ],
  templateUrl: './driver-ride-active.html',
  styleUrls: ['./driver-ride-active.scss']
})
export class DriverRideActive implements OnInit, OnDestroy {
 
  rideData: any = null;
  rideLoaded: boolean = false;
  passengerName: string = '';
  showPinVerification: boolean = false;
  distanceKm: number = 0;
  durationMin: number = 0;
  fare: number = 0;

  private sub: Subscription | null = null;
  @ViewChild(MapComponent) mapComponent!: MapComponent;
 
  constructor(
    private router: Router,
    public passengerRideService: PassengerRideService,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private cdr: ChangeDetectorRef,
    private bookingService: BookingService,
    private signalrService: SignalrService,
    private driverRideService: DriverRideService
  ) {}

  ngOnInit() {
    const pickup = this.passengerRideService.pickup;
    const destination = this.passengerRideService.destination;
    const driver = this.passengerRideService.selectedDriver;
    this.passengerName = this.passengerRideService.passengerName;

    if (!pickup || !destination || !driver) {
      this.router.navigate(['/driver/landing']);
      return;
    }
 
    this.rideData = {
      passengerName: this.passengerName,
      pickup,
      destination,
      driver
    };

    this.rideLoaded = true;
 
    setTimeout(() => {
      if (
        this.mapComponent &&
        this.rideData?.driver?.latitude &&
        this.rideData?.driver?.longitude &&
        this.rideData?.pickup?.latitude &&
        this.rideData?.pickup?.longitude &&
        this.rideData?.destination?.latitude &&
        this.rideData?.destination?.longitude
      ) {
 
        this.mapComponent.onDriverReachedPickup(() => {
          this.ngZone.run(() => {
            this.showPinVerification = true;
            this.changeDetectorRef.markForCheck();
            this.cdr.markForCheck();
          });
        });
        this.mapComponent.startDriverAnimation(
          this.rideData.driver,
          this.rideData.pickup,
          this.rideData.destination,
          this.rideData.pickup?.name,
          this.rideData.destination?.name
        );
      } else {
        console.error('Missing coordinates- animation not started', this.rideData);
      }
    }, 1500);
  }
 
  onRouteInfo(data: { distanceKm: number; durationMin: number }) {
    this.passengerRideService.setRouteInfo(data.distanceKm, data.durationMin);
    this.distanceKm = this.passengerRideService.distanceKm;
    this.durationMin = this.passengerRideService.durationMin;
    this.fare = this.passengerRideService.fare;
    this.driverRideService.setFare(this.fare);
    this.driverRideService.setDistanceKm(data.distanceKm);

    const raw = sessionStorage.getItem('receipt_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.distanceKm = data.distanceKm;
      sessionStorage.setItem('receipt_state', JSON.stringify(parsed));
    }
    this.changeDetectorRef.detectChanges();
    this.cdr.detectChanges();
  }
  onDriverReached() {
    this.ngZone.run(() => {
      this.showPinVerification = true;
    });
  }
 
  get ridePin(): string {
    return this.passengerRideService.pin;
  }
 
  onPinVerified(pin: string): void {
    this.bookingService.verifyPin(this.passengerRideService.bookingId, pin)
      .subscribe({
        next: () => {
          this.signalrService.notifyPassengerPinVerified(
            this.passengerRideService.passengerId,
            true
          );
          this.showPinVerification = false;
          this.changeDetectorRef.detectChanges();
          this.cdr.detectChanges();
          
          this.mapComponent.stopDriverAnimation();
          this.router.navigate(['/driver/trip-details']);
        },
        error: (error: any) => {
          console.error('PIN verify failed:', error);

          this.signalrService.notifyPassengerPinVerified(
            this.passengerRideService.passengerId,
            false
          );
        }
      });
  }
 
  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.mapComponent?.stopDriverAnimation();
  }
}
 