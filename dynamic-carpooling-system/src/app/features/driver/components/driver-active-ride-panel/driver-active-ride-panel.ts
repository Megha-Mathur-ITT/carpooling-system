import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalrService } from '../../../../core/services/signalr';
import { Router } from '@angular/router';
import { RideSummary } from '../../../../shared/components/ride-summary/ride-summary';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-driver-active-ride-panel',
  standalone: true,
  imports: [CommonModule, RideSummary],
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
    private router: Router
  ) { }

  ngOnInit(): void {
    this.subs.push(
      this.signalrService.passengerPaid$.subscribe(data => {
        if (data) {
          this.isPaymentPending = true;
        }
      })
    );
  }

  get passengerInitial(): string {
    return (this.activeRide?.passengerName || 'P').charAt(0).toUpperCase();
  }

  confirmCashReceived(): void {
    this.signalrService.notifyPaymentConfirmed(
      this.activeRide.passengerId,
      this.activeRide.rideRequestId
    );

    console.log("this.activeRide: ", this.activeRide);

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

  denyCashReceived(): void {
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