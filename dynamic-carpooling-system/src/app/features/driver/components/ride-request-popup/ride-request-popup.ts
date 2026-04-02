import {
  Component, Input, Output, EventEmitter,
  OnChanges, OnDestroy, NgZone, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RideRequestService } from '../../../../core/services/ride-request-service';
import { BookingService } from '../../../../core/services/booking-service';
import { Router } from '@angular/router';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { RideRequest } from '../../services/ride-session';
import { trimLocation } from '../../../../shared/utils/locationUtil';

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

  readonly trimLocation = trimLocation;

  isLoading = false;
  timeLeft = 30;
  timerPercent = 100;
  private timer: any = null;

  constructor(
    private rideRequestService: RideRequestService,
    private bookingService: BookingService,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
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
          this.changeDetectorRef.markForCheck();

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
    if (!this.request) {
      return;
    }

    const requestId = this.request.requestId;
    this.isLoading = true;

    this.rideRequestService.respondToRequest(
      requestId, 'Rejected'
    ).subscribe({
      next: () => { 
        this.rejected.emit(); 
        this.isLoading = false; 
      },
      error: () => { 
        this.rejected.emit(); 
        this.isLoading = false; 
      }
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
            const idx = (acceptedBooking.rideRequestIds ?? acceptedBooking.requestIds ?? [])
              .findIndex((id: string) => id === this.request!.requestId);

            const fareIndex = idx !== -1 ? idx : 0;

            this.passengerRideService.setPickup(this.request!.pickup);
            this.passengerRideService.setDestination(this.request!.destination);
            this.passengerRideService.passengerName = acceptedBooking.passengerName;
            this.passengerRideService.setBookingResult(
              acceptedBooking.fares?.[fareIndex] ?? acceptedBooking.fare?.[fareIndex] ?? 0,
              acceptedBooking.piNs?.[fareIndex] ?? acceptedBooking.pin?.[fareIndex] ?? ''
            );
            this.passengerRideService.setBookingId(acceptedBooking.bookingId ?? '');
            this.passengerRideService.setRideRequestId(this.request!.requestId);
            this.passengerRideService.setPassengerId(this.request!.passengerId);
            this.passengerRideService.selectedDriver = {
              latitude: this.currentDriverLat,
              longitude: this.currentDriverLng,
              driverName: 'You'
            };

            this.request = null;
            this.accepted.emit();
            // this.isLoading = false;
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
    if (!this.request) {
      return;
    }

    const requestId = this.request.requestId;
    this.stopTimer();
    this.isLoading = true;
    this.request = null;

    this.rideRequestService.respondToRequest(
      requestId, 'Rejected'
    ).subscribe({
      next: () => {
        this.request = null;
        this.rejected.emit();
        this.isLoading = false;
      },
      error: () => {
        this.request = null;
        this.rejected.emit();
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}