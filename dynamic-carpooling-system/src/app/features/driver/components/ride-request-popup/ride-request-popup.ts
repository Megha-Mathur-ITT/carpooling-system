import {
  Component, Input, Output, EventEmitter,
  OnChanges, OnDestroy, NgZone, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RideRequestService } from '../../../../core/services/ride-request-service';
import { BookingService } from '../../../../core/services/booking-service';
import { Router } from '@angular/router';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';

interface LocationDto {
  latitude: number;
  longitude: number;
  name: string;
}

interface RideRequest {
  requestId: string;
  passengerId: string;
  passengerName: string;
  pickup: LocationDto;
  destination: LocationDto;
  requestedAt: string;
  rideRequestStatus: string;
  sessionId: string;
}

@Component({
  selector: 'app-ride-request-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ride-request-popup.html',
  styleUrl: './ride-request-popup.scss',
})
export class RideRequestPopup implements OnChanges, OnDestroy {

  @Input() request: RideRequest | null = null;
  @Input() currentDriverLat!: number;
  @Input() currentDriverLng!: number;

  @Output() accepted = new EventEmitter<void>();
  @Output() rejected = new EventEmitter<void>();

  isLoading = false;
  timeLeft = 30;
  timerPercent = 100;
  private timer: any = null;

  constructor(
    private rideRequestService: RideRequestService,
    private bookingService: BookingService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private passengerRideService: PassengerRideService
  ) { }

  ngOnChanges() {
    if (this.request) {
      this.startTimer();
    } else {
      this.stopTimer();
    }
  }

  startTimer() {
    this.timeLeft = 30;
    this.timerPercent = 100;
    this.stopTimer();

    this.ngZone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        this.ngZone.run(() => {
          this.timeLeft--;
          this.timerPercent = (this.timeLeft / 30) * 100;
          this.cdr.markForCheck();

          if (this.timeLeft <= 0) {
            this.stopTimer();
            this.autoReject();
          }
        });
      }, 1000);
    });
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  autoReject() {
    if (!this.request) return;
    this.isLoading = true;

    this.rideRequestService.respondToRequest(
      this.request.requestId, 'Rejected'
    ).subscribe({
      next: () => { this.rejected.emit(); this.isLoading = false; },
      error: () => { this.rejected.emit(); this.isLoading = false; }
    });
  }

  accept() {
    this.stopTimer();
    this.isLoading = true;

    this.rideRequestService.respondToRequest(
      this.request!.requestId, 'Accepted'
    ).subscribe({
      next: () => {
        this.bookingService.acceptBooking(
          this.request!.requestId,
          this.request!.sessionId
        ).subscribe({
          next: (acceptedBooking: any) => {
            this.passengerRideService.setPickup(this.request!.pickup);
            this.passengerRideService.setDestination(this.request!.destination);
            this.passengerRideService.passengerName = acceptedBooking.passengerName;
            this.passengerRideService.setBookingResult(
              acceptedBooking.fare,
              acceptedBooking.pin
            );
            this.passengerRideService.bookingId = acceptedBooking.bookingId;
            this.passengerRideService.selectedDriver = {
              latitude: this.currentDriverLat,
              longitude: this.currentDriverLng,
              driverName: 'You'
            };

            this.request = null;
            this.accepted.emit();
            this.isLoading = false;
            this.router.navigate(['/driver/ride-active']);
          },
          error: (err: any) => {
            console.error('Accept booking error:', err);
            this.isLoading = false;
          }
        });
      },
      error: (err: any) => {
        console.error('Respond to request error:', err);
        this.isLoading = false;
      }
    })
  }


  reject() {
    this.stopTimer();
    this.isLoading = true;

    this.rideRequestService.respondToRequest(
      this.request!.requestId, 'Rejected'
    ).subscribe({
      next: () => { this.rejected.emit(); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}