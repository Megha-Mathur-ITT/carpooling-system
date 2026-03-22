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

  private sub: Subscription | null = null;

  @ViewChild(MapComponent) mapComponent!: MapComponent;

  constructor(
    private router: Router,
    public passengerRideService: PassengerRideService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {

    const pickup = this.passengerRideService.pickup;
    const destination = this.passengerRideService.destination;
    const driver = this.passengerRideService.selectedDriver;
    this.passengerName = this.passengerRideService.passengerName;

    console.log('Service Data:', pickup, destination, driver);

    if (!pickup || !destination || !driver) {
      this.router.navigate(['/driver/landing']);
      return;
    }

    this.rideData = {
      passengerName : this.passengerName,
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
              this.cdr.markForCheck();
          });
        });
        
        console.log('Starting animation...');

        this.mapComponent.startDriverAnimation(
          this.rideData.driver.latitude,
          this.rideData.driver.longitude,
          this.rideData.pickup.latitude,
          this.rideData.pickup.longitude,
          this.rideData.destination.latitude,
          this.rideData.destination.longitude
        );
      } else {
        console.error('Missing coordinates → animation not started', this.rideData);
      }
    }, 1500);
  }

  onRouteInfo(data: { distanceKm: number; durationMin: number }) {
    this.passengerRideService.setRouteInfo(data.distanceKm, data.durationMin);
  }


  onDriverReached() {
    console.log('SHOW PIN NOW');

    this.ngZone.run(() => {
      this.showPinVerification = true;
    });
  }

  get ridePin(): string {
    return this.passengerRideService.pin;
  }

  onPinVerified(pin: string): void {
    this.showPinVerification = false;
    // TODO: navigate to ride-in-progress or call backend to confirm boarding
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}