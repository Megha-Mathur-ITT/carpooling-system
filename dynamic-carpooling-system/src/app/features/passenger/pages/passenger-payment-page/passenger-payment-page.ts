import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { Subscription } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { SignalrService } from '../../../../core/services/signalr';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';

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
    public rideService: PassengerRideService
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    this.signalrService.connect(); 

    if (!this.loadState()) {
      return;
    }

    this.restoreWaitingState();
    this.listenToPaymentConfirmEvent();
    this.listenToPaymentDeniedEvent();
  }

  private loadState(): boolean {
    const freshNavigationState = this.router.getCurrentNavigation()?.extras?.state;
    const state = freshNavigationState ?? history.state ?? JSON.parse(sessionStorage.getItem('payment_state') || 'null');

    if (!state?.fare) {
      this.router.navigate(['/passenger/landing']);
      return false;
    }

    this.fare = state.fare;
    this.distanceKm = state.distanceKm;
    this.driver = state.driver;
    this.pickup = state.pickup;
    this.destination = state.destination;
    this.driverId = state.driverId;
    this.rideRequestId = state.rideRequestId;

    return true;
  }

  private restoreWaitingState() {
    this.isWaitingForDriver = sessionStorage.getItem('payment_waiting') === 'true';

    if (this.isWaitingForDriver) {
      this.subs.push(
        this.signalrService.connectionStatus$.pipe(
          filter(status => status === "connected"),
          first()
        ).subscribe(status => {
          if (status === "connected") {
            this.signalrService.notifyDriverPassengerPaid(
              this.driverId,
              this.rideRequestId
            );
          }
        })
      );
    }
  }

  private listenToPaymentConfirmEvent() {
    this.subs.push(
      this.signalrService.paymentConfirmed$.subscribe(data => {
        sessionStorage.removeItem('payment_waiting');

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
  }

  private listenToPaymentDeniedEvent() {
    this.subs.push(
      this.signalrService.paymentDenied$.subscribe(data => {
        if (data) {
          sessionStorage.removeItem("payment_waiting");

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
    sessionStorage.setItem("payment_waiting", "true");

    this.signalrService.notifyDriverPassengerPaid(
      this.driverId,
      this.rideRequestId
    );
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    sessionStorage.removeItem("payment_state");
    this.subs.forEach(sub => sub.unsubscribe());
  }
}