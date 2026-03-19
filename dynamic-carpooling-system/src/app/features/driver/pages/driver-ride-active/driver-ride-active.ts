import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PassengerDetails } from '../../components/passenger-details/passenger-details';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar'; 
import { Footer } from '../../../../core/layout/footer/footer';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { MapComponent } from '../../../../shared/components/map/map';
import {Router} from '@angular/router';

@Component({
  selector: 'app-driver-ride-active',
  standalone: true,
  imports: [
    CommonModule,
    PassengerDetails,
    NavbarComponent,
    MapComponent,
    Footer
],
  templateUrl: './driver-ride-active.html',
  styleUrls: ['./driver-ride-active.scss'],
})

export class DriverRideActive {
  rideData: any;
  rideLoaded = false; 

  distanceKm: number = 0;
  durationMin: number = 0;
  fare: number = 0;

  hasReachedPickup = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.rideData = history.state?.ride ?? null;
      console.log('RideData (constructor):', this.rideData);
      console.log('Full rideData:', JSON.stringify(this.rideData, null, 2));
    }
  }

  ngOnInit() {
     this.rideLoaded = true; 
  }

  onRouteInfo(data: { distanceKm: number; durationMin: number }) {
    this.distanceKm = data.distanceKm;
    this.durationMin = data.durationMin;
    this.fare = Math.round(this.distanceKm * 9); 
  }

  markArrivedAtPickup(): void {
    this.hasReachedPickup = true;
  }
 
  onPinVerified(pin: string): void {
    console.log('PIN verified:', pin);
  }
 
  onResendPin(): void {
    console.log('Resend PIN requested');
  }
}