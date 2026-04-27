
import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  HostListener,
  ElementRef,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval, Subscription, merge } from 'rxjs';
import { BookingService } from '../../../core/services/booking-service';
import { AuthService } from '../../../core/services/auth-service';
import { RideSessionService } from '../../../features/driver/services/ride-session';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-passenger-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './passenger-list.html',
  styleUrls: ['./passenger-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PassengerListComponent implements OnInit, OnDestroy, OnChanges {

  @Input() isOnline: boolean = false;

  isOpen = false;
  loading = false;
  isDriver = false;

  private rawBookings: any[] = [];
  private destroy$ = new Subject<void>();
  private pollSub?: Subscription;

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private rideSessionService: RideSessionService,
    private elRef: ElementRef,
  ) { }

  ngOnInit(): void {
    this.authService.loggedInUserRole
      .pipe(takeUntil(this.destroy$))
      .subscribe(role => {
        this.isDriver = role === 2;
      });

    this.rideSessionService.refreshPassengers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPassengers());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOnline']) {
      if (this.isOnline) {
        this.loadPassengers();
        this.pollSub = interval(30_000)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.loadPassengers());
      } else {
        this.rawBookings = [];
        this.isOpen = false;
        this.pollSub?.unsubscribe();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  } 

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  get boardedPassengers(): any[] {
    const currentSessionId = this.rideSessionService.currentSessionId;
    const rows: any[] = [];

    for (const booking of this.rawBookings) {
      if (currentSessionId && booking.sessionId !== currentSessionId) continue;

      const boardedAts: (string | null)[] = booking.boardedAts ?? [];
      boardedAts.forEach((boardedAt: string | null, i: number) => {
        if (!boardedAt) return;

        const nameFromBooking = (booking.passengerName || '').trim();
        const nameFromCache = this.rideSessionService.getPassengerName(booking.sessionId);
        const name = nameFromBooking || nameFromCache || null;
        const status = String(booking.statuses?.[i] ?? booking.status ?? '');

        rows.push({
          passengerName: name,
          fare: booking.fares?.[i] ?? booking.fare ?? 0,
          boardedAt: new Date(boardedAt),
          status,
        });
      });
    }
    return rows;
  }

  get boardedCount(): number {
    return this.boardedPassengers.length;
  }

  getInitials(name: string | null): string | null {
    if (!name) return null;
    const parts = name.trim().split(' ').filter(n => n.length > 0);
    if (parts.length === 0) return null;
    return parts.map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  isDone(status: string): boolean {
    const s = String(status ?? '').toLowerCase();
    return s === 'completed' || s === '2';
  }

  private loadPassengers(): void {
    this.loading = true;
    this.bookingService
      .getDriverBookings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any[]) => {
          this.rawBookings = Array.isArray(data) ? data : [];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
