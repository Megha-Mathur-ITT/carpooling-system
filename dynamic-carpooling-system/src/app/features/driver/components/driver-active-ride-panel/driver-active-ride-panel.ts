import { Component, Inject, PLATFORM_ID, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SignalrService } from '../../../../core/services/signalr';
import { Router } from '@angular/router';
import { RideSummary } from '../../../../shared/components/ride-summary/ride-summary';
import { Subscription } from 'rxjs';
import { PaymentConfirm } from '../payment-confirm/payment-confirm';

@Component({
  selector: 'app-driver-active-ride-panel',
  standalone: true,
  imports: [CommonModule, RideSummary, PaymentConfirm],
  templateUrl: './driver-active-ride-panel.html',
  styleUrl: './driver-active-ride-panel.scss'
})
export class DriverActiveRidePanel implements OnInit, OnDestroy {
  @Input() activeRide: any = null;

  @Output() rideCompleted = new EventEmitter<void>();
  @Output() rideCancelled = new EventEmitter<void>();

  isPaymentPending = false;
  private subs: Subscription[] = [];

  constructor(
    private signalrService: SignalrService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isPaymentPending = sessionStorage.getItem("driver_payment_pending") === "true";

      if (this.isPaymentPending) {
        this.changeDetectorRef.markForCheck();
      }
    }

    this.subs.push(
      this.signalrService.passengerPaid$.subscribe(data => {
        if (data) {
          this.isPaymentPending = true;
          this.changeDetectorRef.markForCheck();

          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('driver_payment_pending', 'true');
          }
        }
      })
    );
  }

  onPaymentConfirmed(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_payment_pending');
    }

    this.signalrService.notifyPaymentConfirmed(
      this.activeRide.passengerId,
      this.activeRide.rideRequestId
    );

    this.router.navigate(['/driver/receipt'], {
      state: {
        fare: this.activeRide.fare,
        distanceKm: this.activeRide.distanceKm ?? 0,
        isDriver: true,
        passenger: {
          passengerName: this.activeRide.passengerName
        },
        driver: {
          vehicleName: this.activeRide.vehicleName
        },
        pickup: {
          name: this.activeRide.pickupName
        },
        destination: {
          name: this.activeRide.destinationName
        }
      }
    });

    this.rideCompleted.emit();
  }

  onPaymentDenied(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_payment_pending');
    }

    this.signalrService.notifyPaymentDenied(
      this.activeRide.passengerId,
      this.activeRide.rideRequestId
    );

    this.isPaymentPending = false;
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}
