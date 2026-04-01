import { Component, Inject, PLATFORM_ID, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SignalrService } from '../../../../core/services/signalr';
import { Router } from '@angular/router';
import { RideSummary } from '../../../../shared/components/ride-summary/ride-summary';
import { Subscription } from 'rxjs';
import { PaymentConfirm } from '../payment-confirm/payment-confirm';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';

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
  pendingPayments: any[] = [];
  isPaymentPanelOpen = false;
  selectedPayment: any = null;
  private subs: Subscription[] = [];

  constructor(
    private signalrService: SignalrService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private changeDetectorRef: ChangeDetectorRef,
    public passengerRideService: PassengerRideService,
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedPayments = sessionStorage.getItem("driver_pending_payments");

      if (savedPayments) {
        this.pendingPayments = JSON.parse(savedPayments);

        if (this.pendingPayments.length > 0) {
          this.isPaymentPanelOpen = true;
          this.selectedPayment = this.pendingPayments[0];
        }
      }
    }

    if (this.activeRide) {
      this.activeRide.fare = this.passengerRideService.fare || this.activeRide.fare;
      this.activeRide.distanceKm = this.passengerRideService.distanceKm || this.activeRide.distanceKm;
    }

    this.subs.push(
      this.signalrService.passengerPaid$.subscribe(data => {
        if (data) {
          this.isPaymentPending = true;
          this.changeDetectorRef.markForCheck();

          const exists = this.pendingPayments.some(p => p.rideRequestId === data.rideRequestId);

          if (!exists) {
            this.pendingPayments.push(data);
            this.updateStorage();
            this.changeDetectorRef.markForCheck();
          }

          if (!this.selectedPayment) {
            this.selectedPayment = this.pendingPayments[0];
          }

          this.isPaymentPanelOpen = true;
          this.changeDetectorRef.markForCheck();
        }
      })
    );
  }

  selectPayment(payment: any): void {
    this.selectedPayment = payment;
    this.changeDetectorRef.markForCheck();
  }

  getInitials(name: string): string {
    if (!name) {
      return '?';
    }
    return name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  onPaymentConfirmed(): void {
    if (!this.selectedPayment) {
      return;
    }

    const payment = this.selectedPayment;

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_payment_pending');
    }

    this.signalrService.notifyPaymentConfirmed(
      payment.passengerId,
      payment.rideRequestId
    )

    this.removePayment(payment.rideRequestId);

    this.router.navigate(['/driver/receipt'], {
      state: {
        fare: payment.fare || this.passengerRideService.fare || this.activeRide?.fare,
        distanceKm: payment.distanceKm || this.passengerRideService.distanceKm || this.activeRide?.distanceKm || 0,
        isDriver: true,
        passenger: {
          passengerName: payment.passengerName
        },
        driver: {
          vehicleName: this.activeRide?.vehicleName
        },
        pickup: {
          name: payment.pickupName || this.activeRide?.pickupName
        },
        destination: {
          name: payment.destinationName || this.activeRide?.destinationName
        }
      }
    });

    if (this.pendingPayments.length === 0) {
      this.rideCompleted.emit();
    }
  }

  onPaymentDenied(): void {
    if (!this.selectedPayment) {
      return;
    }

    const payment = this.selectedPayment;

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_payment_pending');
    }

    this.signalrService.notifyPaymentDenied(
      payment.passengerId,
      payment.rideRequestId
    );

    this.removePayment(payment.rideRequestId);

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_payment_pending');
    }
  }

  private removePayment(requestId: string) {
    this.pendingPayments = this.pendingPayments.filter(payment => payment.rideRequestId !== requestId);

    if (this.pendingPayments.length === 0) {
      this.isPaymentPanelOpen = false;
    }

    this.updateStorage();
    this.changeDetectorRef.markForCheck();
  }

  private updateStorage() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('driver_pending_payments', JSON.stringify(this.pendingPayments));
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(
      sub => sub.unsubscribe()
    );
  }
}
