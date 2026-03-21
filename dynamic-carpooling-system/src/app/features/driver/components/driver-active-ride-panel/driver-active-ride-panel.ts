import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalrService } from '../../../../core/services/signalr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-driver-active-ride-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-active-ride-panel.html',
  styleUrl: './driver-active-ride-panel.scss'
})
export class DriverActiveRidePanel {
  @Input() activeRide: any = null;

  @Output() rideCompleted = new EventEmitter<void>();
  @Output() rideCancelled = new EventEmitter<void>();

  isPaymentPending = false;

  constructor(private signalrService: SignalrService) {}

  get passengerInitial(): string {
    return (this.activeRide?.passengerName || 'P').charAt(0).toUpperCase();
  }

  completeRide(): void {
    this.isPaymentPending = true;
  }

  confirmCashReceived():void {
    this.signalrService.notifyPaymentConfirmed(
      this.activeRide.passengerId,
      this.activeRide.rideRequestId
    );

    this.rideCompleted.emit();
  }

  denyCashReceived(): void {
    this.signalrService.notifyPaymentDenied(
      this.activeRide.passengerId,
      this.activeRide.rideRequestId
    );

    this.isPaymentPending = false; 
  }

  cancelRide(): void {
    this.rideCancelled.emit();
  }

  ngOnDestroy(): void {}
}