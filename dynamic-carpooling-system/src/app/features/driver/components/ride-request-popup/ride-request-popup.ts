import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RideRequestService } from '../../../../core/services/ride-request-service';

@Component({
  selector: 'app-ride-request-popup',
  imports: [CommonModule],
  templateUrl: './ride-request-popup.html',
  styleUrl: './ride-request-popup.scss',
})
export class RideRequestPopup {
   @Input() request: any = null;
  @Output() accepted = new EventEmitter<void>();
  @Output() rejected = new EventEmitter<void>();

  isLoading = false;

  constructor(private rideRequestService: RideRequestService) {}

  accept() {
    this.isLoading = true;
    this.rideRequestService.respondToRequest(
      this.request.requestId, 'Accepted'
    ).subscribe({
      next: () => { this.accepted.emit(); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  reject() {
    this.isLoading = true;
    this.rideRequestService.respondToRequest(
      this.request.requestId, 'Rejected'
    ).subscribe({
      next: () => { this.rejected.emit(); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }
}
