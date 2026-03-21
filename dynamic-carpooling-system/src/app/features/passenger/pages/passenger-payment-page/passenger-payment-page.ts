import { Component, OnInit, Inject, PLATFORM_ID} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';

@Component({
  selector: 'app-passenger-payment-page',
  imports: [CommonModule, NavbarComponent, Footer],
  templateUrl: './passenger-payment-page.html',
  styleUrl: './passenger-payment-page.scss',
})
export class PassengerPaymentPage implements OnInit {
  fare: number = 0;
  distanceKm: number = 0;
  driver: any = null;
  pickup: any = null;
  destination: any = null;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if(!isPlatformBrowser(this.platformId)) {
      return;
    }

    const state = this.router.getCurrentNavigation()?.extras?.state ?? history.state;

    if (!state?.fare) {
      this.router.navigate(['/passenger/landing']);
      return;
    }

    this.fare = state.fare;
    this.distanceKm = state.distanceKm;
    this.driver = state.driver;
    this.pickup = state.pickup;
    this.destination = state.destination;
  }

  confirmPayment() {
    this.router.navigate(['/passenger/receipt'], {
      state: {
        fare: this.fare,
        distanceKm: this.distanceKm,
        driver: this.driver,
        pickup: this.pickup,
        destination: this.destination
      }
    });
  }
}
