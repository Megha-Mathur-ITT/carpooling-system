import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../core/layout/navbar/navbar';
import { Footer } from '../../../core/layout/footer/footer';
import { UserRole } from '../../../core/models/auth-model';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-ride-receipt',
  imports: [CommonModule, NavbarComponent, Footer],
  templateUrl: './ride-receipt.html',
  styleUrl: './ride-receipt.scss',
})
export class RideReceipt implements OnInit{
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
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const state = this.router.getCurrentNavigation()?.extras?.state ?? history.state;

    if (!state?.fare) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    this.fare = state.fare;
    this.distanceKm = state.distanceKm ?? 0;
    this.driver = state.driver;
    this.passenger = state.passenger;
    this.pickup = state.pickup;
    this.destination = state.destination;
    this.isDriver = state.isDriver ?? false;
  }

  goHome(): void {
    const role = this.authService.getUserRole();

    if (role === UserRole.Driver) {
      this.router.navigate(['/driver/landing']);
    } else {
      this.router.navigate(['/passenger/landing']);
    }
  }
}
