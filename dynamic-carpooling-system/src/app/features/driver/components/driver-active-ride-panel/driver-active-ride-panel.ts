import {
  Component,
  Inject,
  PLATFORM_ID,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SignalrService } from '../../../../core/services/signalr';
import { Router } from '@angular/router';
import { RideSummary } from '../../../../shared/components/ride-summary/ride-summary';
import { Subscription } from 'rxjs';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';

@Component({
  selector: 'app-driver-active-ride-panel',
  standalone: true,
  imports: [CommonModule, RideSummary],
  templateUrl: './driver-active-ride-panel.html',
  styleUrl: './driver-active-ride-panel.scss',
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
  confirmedReceipts: any[] = [];

  constructor(
    private signalrService: SignalrService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private changeDetectorRef: ChangeDetectorRef,
    public passengerRideService: PassengerRideService,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedPayments = sessionStorage.getItem('driver_pending_payments');

      if (savedPayments) {
        this.pendingPayments = JSON.parse(savedPayments);

        if (this.pendingPayments.length > 0) {
          this.isPaymentPanelOpen = true;
          this.selectedPayment = this.pendingPayments[0];
        }
      }

      const savedReceipts = sessionStorage.getItem('driver_confirmed_receipts');
      if (savedReceipts) {
        this.confirmedReceipts = JSON.parse(savedReceipts);
      }
    }

    this.subs.push(
      this.signalrService.passengerPaid$.subscribe((data) => {
        if (data) {
          this.isPaymentPending = true;
          this.changeDetectorRef.markForCheck();

          const exists = this.pendingPayments.some(
            (payment) => payment.rideRequestId === data.rideRequestId,
          );

          if (!exists) {
            const boardedPassengers: any[] = JSON.parse(
              sessionStorage.getItem('boardedPassengers') || '[]',
            );
            const passengerIds: string[] = JSON.parse(
              sessionStorage.getItem('passengerIds') || '[]',
            );

            const matched = boardedPassengers.find(
              (passenger: any) => passenger.passengerId === data.passengerId,
            );
            const enrichedPayment = {
              rideRequestId: data.rideRequestId,
              passengerId: data.passengerId,
              passengerName: matched?.name || this.activeRide?.passengerName || 'Passenger',
              fare: matched?.fare ?? this.activeRide?.fare ?? 0,
              distanceKm: matched?.distanceKm ?? this.activeRide?.distanceKm ?? 0,
              pickupName: matched?.pickupName ?? this.activeRide?.pickupName,
              destinationName: matched?.destinationName ?? this.activeRide?.destinationName,
            };

            this.pendingPayments.push(enrichedPayment);
            this.updateStorage();
            this.changeDetectorRef.markForCheck();
          }

          if (!this.selectedPayment) {
            this.selectedPayment = this.pendingPayments[0];
          }

          this.isPaymentPanelOpen = true;
          this.changeDetectorRef.markForCheck();
        }
      }),
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
    return name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  get waitingPassengers(): string[] {
    const boardedPassengers: any[] = JSON.parse(
      sessionStorage.getItem('boardedPassengers') || '[]',
    );
    const confirmedNames = new Set(this.confirmedReceipts.map((receipt) => receipt.passengerName));
    const pendingNames = new Set(this.pendingPayments.map((passenger) => passenger.passengerName));

    return boardedPassengers
      .map((passenger) => passenger.name)
      .filter((name) => !confirmedNames.has(name) && !pendingNames.has(name));
  }

  onPaymentConfirmed(): void {
    if (!this.selectedPayment) {
      return;
    }

    const payment = this.selectedPayment;

    this.confirmedReceipts.push({
      passengerName: payment.passengerName,
      fare: payment.fare,
      distanceKm: payment.distanceKm,
      pickupName: payment.pickupName,
      destinationName: payment.destinationName,
    });

    sessionStorage.setItem('driver_confirmed_receipts', JSON.stringify(this.confirmedReceipts));

    this.signalrService.notifyPaymentConfirmed(payment.passengerId, payment.rideRequestId);

    this.removePayment(payment.rideRequestId);
    this.selectedPayment = this.pendingPayments.length > 0 ? this.pendingPayments[0] : null;

    const expectedCount = parseInt(sessionStorage.getItem('driver_expected_payments') ?? '1', 10);

    if (this.confirmedReceipts.length >= expectedCount) {
      const totalFare = this.confirmedReceipts.reduce(
        (sum, receipt) => sum + (receipt.fare ?? 0),
        0,
      );
      sessionStorage.setItem('driver_confirmed_receipts', JSON.stringify(this.confirmedReceipts));
      this.rideCompleted.emit();

      this.router.navigate(['/driver/receipt'], {
        state: {
          isDriver: true,
          fare: totalFare,
          receipts: this.confirmedReceipts,
          vehicleName: this.activeRide?.vehicleName,
          pickup: { name: this.confirmedReceipts[0]?.pickupName ?? this.activeRide?.pickupName },
          destination: { name: this.activeRide?.destinationName },
          distanceKm: this.activeRide?.distanceKm ?? 0,
        },
      });
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

    this.signalrService.notifyPaymentDenied(payment.passengerId, payment.rideRequestId);

    this.removePayment(payment.rideRequestId);

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('driver_payment_pending');
    }
  }

  private removePayment(requestId: string) {
    this.pendingPayments = this.pendingPayments.filter(
      (payment) => payment.rideRequestId !== requestId,
    );

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
    this.subs.forEach((sub) => sub.unsubscribe());
  }
}
