import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../core/layout/navbar/navbar';
import { Footer } from '../../../core/layout/footer/footer';
import { UserRole } from '../../../core/models/auth-model';
import { AuthService } from '../../../core/services/auth-service';
import { PassengerRideService } from '../../../core/services/passenger-ride-service';
import { DriverRideService } from '../../../features/driver/services/driver-ride-service';

@Component({
  selector: 'app-ride-receipt',
  imports: [CommonModule, NavbarComponent, Footer],
  templateUrl: './ride-receipt.html',
  styleUrl: './ride-receipt.scss',
})
export class RideReceipt implements OnInit {
  fare: number = 0;
  distanceKm: number = 0;
  driver: any = null;
  passenger: any = null;
  pickup: any = null;
  destination: any = null;
  isDriver: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private passengerRideService: PassengerRideService,
    private driverRideService: DriverRideService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const navState = history.state;

    if (navState?.fare) {
      sessionStorage.setItem('receipt_state', JSON.stringify(navState));
    }

    const raw = sessionStorage.getItem('receipt_state');
    const state = navState?.fare ? navState : (raw ? JSON.parse(raw) : null);

    if (!state?.fare) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    this.fare = state.fare;
    this.distanceKm = (state.distanceKm && state.distanceKm > 0)
      ? state.distanceKm
      : this.driverRideService.getDistanceKm();
    this.driver = state.driver ?? null;
    this.passenger = state.passenger ?? null;
    this.pickup = state.pickup ?? null;
    this.destination = state.destination ?? null;
    this.isDriver = state.isDriver ?? false;
  }

  goHome(): void {
    sessionStorage.removeItem('receipt_state');
    this.driverRideService.clearAll();
  this.passengerRideService.clearAll();

  this.router.navigate(['/']);
  }

  get pickupName(): string {
    if (!this.pickup) return '—';
    if (typeof this.pickup === 'string') return this.pickup;
    if (typeof this.pickup?.name === 'string') return this.pickup.name;
    if (typeof this.pickup?.name?.name === 'string') return this.pickup.name.name;
    if (typeof this.pickup?.name?.address === 'string') return this.pickup.name.address;
    return '—';
  }

  get destinationName(): string {
    if (!this.destination) return '—';
    if (typeof this.destination === 'string') return this.destination;
    if (typeof this.destination?.name === 'string') return this.destination.name;
    if (typeof this.destination?.name?.name === 'string') return this.destination.name.name;
    if (typeof this.destination?.name?.address === 'string') return this.destination.name.address;
    return '—';
  }
}
