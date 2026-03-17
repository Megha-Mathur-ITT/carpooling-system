import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  get passengerInitial(): string {
    return (this.activeRide?.passengerName || 'P').charAt(0).toUpperCase();
  }

  completeRide(): void {
    this.rideCompleted.emit();
  }

  cancelRide(): void {
    this.rideCancelled.emit();
  }
}