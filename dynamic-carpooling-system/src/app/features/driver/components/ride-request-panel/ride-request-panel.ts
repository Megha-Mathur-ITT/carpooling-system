import {
  Component, Input, Output, EventEmitter,
  OnChanges, OnDestroy, NgZone, ChangeDetectorRef, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RideRequest } from '../../services/ride-session';
import { RideRequestService } from '../../../../core/services/ride-request-service';
import { BookingService } from '../../../../core/services/booking-service';
import { PassengerRideService } from '../../../../core/services/passenger-ride-service';
import { trimLocation } from '../../../../shared/utils/locationUtil';
import { SignalrService } from '../../../../core/services/signalr';
import { DriverRideService } from '../../services/driver-ride-service';

interface RequestItem {
  request: RideRequest;
  timeLeft: number;
  timer: any;
}

@Component({
  selector: 'app-ride-request-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ride-request-panel.html',
  styleUrl: './ride-request-panel.scss',
})
export class RideRequestPanel implements OnChanges, OnDestroy {

  @Input() requests: RideRequest[] = [];
  @Input() currentDriverLat!: number;
  @Input() currentDriverLng!: number;

  @Output() accepted = new EventEmitter<void>();
  @Output() allRejected = new EventEmitter<void>();

  readonly trimLocation = trimLocation;

  rideRequestQueue: RequestItem[] = [];
  isLoading = false;

  constructor(
    private rideRequestService: RideRequestService,
    private bookingService: BookingService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private passengerRideService: PassengerRideService,
    private signalrService: SignalrService,
    private driverRideService: DriverRideService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requests']) {
      const incoming: RideRequest[] = changes['requests'].currentValue ?? [];
      const existingIds = new Set(this.rideRequestQueue.map(i => i.request.requestId));
      for (const req of incoming) {
        if (!existingIds.has(req.requestId)) {
          if (this.rideRequestQueue.length >= 2) {
            this.rideRequestService
              .respondToRequest(req.requestId, 'Rejected')
              .subscribe({ error: () => { } });
            this.signalrService.notifyPassengerRejected(
              req.passengerId,
              req.requestId
            );
          }
          else {
            this.addItem(req);
          }
        }
      }
      const incomingIds = new Set(incoming.map(r => r.requestId));
      this.rideRequestQueue
        .filter(i => !incomingIds.has(i.request.requestId))
        .forEach(i => this.removeItem(i));
    }
  }

  trackById(_: number, item: RequestItem): string {
    return item.request.requestId;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('');
  }

  private addItem(request: RideRequest): void {
    const item: RequestItem = { request, timeLeft: 30, timer: null };
    this.rideRequestQueue.push(item);
    this.startTimer(item);
  }

  private startTimer(item: RequestItem): void {
    this.ngZone.runOutsideAngular(() => {
      item.timer = setInterval(() => {
        this.ngZone.run(() => {
          item.timeLeft--;
          this.cdr.markForCheck();
          if (item.timeLeft <= 0) this.autoReject(item);
        });
      }, 1000);
    });
  }

  private stopTimer(item: RequestItem): void {
    if (item.timer) { clearInterval(item.timer); item.timer = null; }
  }

  private removeItem(item: RequestItem): void {
    this.stopTimer(item);
    const idx = this.rideRequestQueue.indexOf(item);
    if (idx !== -1) this.rideRequestQueue.splice(idx, 1);
    this.cdr.markForCheck();
    if (this.rideRequestQueue.length === 0) this.allRejected.emit();
  }

  private autoReject(item: RequestItem): void {
    this.stopTimer(item);
    this.rideRequestService.respondToRequest(item.request.requestId, 'Rejected').subscribe({ error: () => { } });
    this.signalrService.notifyPassengerRejected(
      item.request.passengerId,
      item.request.requestId
    );
    this.removeItem(item);
  }

  accept(item: RequestItem): void {
    this.stopTimer(item);
    this.isLoading = true;
    this.rideRequestService.respondToRequest(item.request.requestId, 'Accepted').subscribe({
      next: () => {
        this.bookingService.acceptBooking(item.request.requestId, item.request.sessionId).subscribe({
          next: (acceptedBooking: any) => {
            // Removed auto-reject logic for multi-passenger support

            this.driverRideService.addActiveRide(acceptedBooking);

            this.passengerRideService.setPickup(item.request.pickup);
            this.passengerRideService.setDestination(item.request.destination);
            this.passengerRideService.setPassengerName(acceptedBooking.passengerName);
            this.passengerRideService.setBookingResult(
              acceptedBooking.fares?.[0] ?? acceptedBooking.fare?.[0] ?? acceptedBooking.fare ?? 0,
              acceptedBooking.piNs?.[0] ?? acceptedBooking.pin ?? ''
            );
            this.passengerRideService.setBookingId(
              acceptedBooking.bookingIds?.[0] ?? acceptedBooking.bookingId ?? ''
            );
            this.passengerRideService.setPassengerId(item.request.passengerId);
            this.passengerRideService.setSelectedDriver({
              latitude: this.currentDriverLat,
              longitude: this.currentDriverLng,
              driverName: 'You'
            });
            this.clearAll();
            this.accepted.emit();
            this.isLoading = false;
            this.router.navigate(['/driver/ride-active']);
          },
          error: (err: any) => { console.error('Accept booking error:', err); this.isLoading = false; }
        });
      },
      error: (err: any) => { console.error('Respond error:', err); this.isLoading = false; }
    });
  }

  rejectAll(): void {
    this.rideRequestQueue.forEach(item => {
      this.stopTimer(item);
      this.rideRequestService.respondToRequest(item.request.requestId, 'Rejected').subscribe({ error: () => { } });
    });
    this.rideRequestQueue = [];
    this.isLoading = false;
    this.cdr.markForCheck();
    this.allRejected.emit();
  }

  private clearAll(): void {
    this.rideRequestQueue.forEach(i => this.stopTimer(i));
    this.rideRequestQueue = [];
  }

  ngOnDestroy(): void { this.clearAll(); }
}