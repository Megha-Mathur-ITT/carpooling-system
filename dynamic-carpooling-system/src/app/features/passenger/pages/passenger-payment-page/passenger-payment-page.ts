import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy, NgZone, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { Subscription } from 'rxjs';
import { SignalrService } from '../../../../core/services/signalr';

@Component({
  selector: 'app-passenger-payment-page',
  imports: [CommonModule, NavbarComponent, Footer],
  templateUrl: './passenger-payment-page.html',
  styleUrl: './passenger-payment-page.scss',
})
export class PassengerPaymentPage implements OnInit, OnDestroy {
  fare: number = 0;
  distanceKm: number = 0;
  driver: any = null;
  pickup: any = null;
  destination: any = null;
  driverId: string = '';
  rideRequestId: string = '';
  isWaitingForDriver = false;
  isPaymentDenied = false;

  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private signalrService: SignalrService,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private appRef: ApplicationRef
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
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
    this.driverId = state.driverId;
    this.rideRequestId = state.rideRequestId;

    this.subs.push(
      this.signalrService.paymentConfirmed$.subscribe(data => {
        if (data) {
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
      })
    );

    this.subs.push(
      this.signalrService.paymentDenied$.subscribe(data => {
        if (data) {
          this.ngZone.run(() => {
            this.isWaitingForDriver = false;
            this.isPaymentDenied = true;

            this.changeDetectorRef.markForCheck();
          })
        }
      })
    );
  }

  confirmPayment() {
    this.isWaitingForDriver = true;
    this.isPaymentDenied = false;

    this.signalrService.notifyDriverPassengerPaid(
      this.driverId,
      this.rideRequestId
    );
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}
