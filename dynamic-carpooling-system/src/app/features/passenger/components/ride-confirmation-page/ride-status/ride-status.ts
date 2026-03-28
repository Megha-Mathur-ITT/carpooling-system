import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trimLocation } from '../../../../../shared/utils/locationUtil';

@Component({
  selector: 'app-ride-status',
  imports: [CommonModule],
  templateUrl: './ride-status.html',
  styleUrl: './ride-status.scss',
})
export class RideStatus {
  @Input() driver: any = null;
  @Input() destination: any = null;
  @Input() isDriverArrived = false;
  @Input() isRideStarted = false;
  @Input() isReachedDestination = false;
  @Input() isPinVerified = false;
  @Input() isPinFailed = false;
  @Input() pinAttempts = 0;

  @Output() onPayDriver = new EventEmitter<void>();

  readonly trimLocation = trimLocation;
  readonly maxPinAttempts = 3;
}
