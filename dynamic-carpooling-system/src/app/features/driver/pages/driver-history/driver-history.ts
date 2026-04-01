import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { RideHistoryService } from '../../../../core/services/ride-history.service';
import { DriverHistoryDto } from '../../../../core/models/ride-history.model';
import { SignalrService } from '../../../../core/services/signalr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-driver-history',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './driver-history.html',
  styleUrls: ['./driver-history.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverHistory implements OnInit, OnDestroy {

  history: DriverHistoryDto[] = [];
  isLoading = true;
  errorMsg: string | null = null;

  totalTrips = 0;
  totalEarned = 0;
  avgRating = 0;

  tripsThisMonth = 0;
  earnedThisMonth = 0;
  ratingPercentile = '';

  private driverRatedSub!: Subscription;

  constructor(
    private historyService: RideHistoryService,
    private cdr: ChangeDetectorRef,
    private signalrService: SignalrService
  ) { }

  ngOnInit(): void {
    this.loadHistory();

    this.driverRatedSub = this.signalrService.driverRated$.subscribe(() => {
      this.loadHistory();
    });
  }

  ngOnDestroy(): void {
    if (this.driverRatedSub) {
      this.driverRatedSub.unsubscribe();
    }
  }

  private loadHistory(): void {
    this.isLoading = true;
    this.errorMsg = null;

    this.historyService.getDriverHistory().subscribe({
      next: (data) => {
        this.history = data.sort(
          (a, b) => new Date(b.dateAndTime).getTime() - new Date(a.dateAndTime).getTime()
        );
        this.computeStats();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message ?? 'Failed to load trip history.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private computeStats(): void {
    this.totalTrips = this.history.length;
    this.totalEarned = this.history.reduce((s, h) => s + (h.totalFare ?? 0), 0);

    const now = new Date();

    this.tripsThisMonth = this.history.filter(h => {
      const d = new Date(h.dateAndTime);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    this.earnedThisMonth = this.history
      .filter(h => {
        const d = new Date(h.dateAndTime);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, h) => s + (h.totalFare ?? 0), 0);

    const allRatings = this.history
      .flatMap(h => h.passengers)
      .map(p => p.ratings)
      .filter((r): r is number => r !== null);

    this.avgRating = allRatings.length
      ? +(allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1)
      : 0;

    this.ratingPercentile =
      this.avgRating >= 4.8 ? 'Top 5% of drivers' :
        this.avgRating >= 4.5 ? 'Top 15% of drivers' :
          'Keep it up!';
  }

  monthLabel(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-IN', {
      month: 'long', year: 'numeric',
    });
  }

  initials(name: string): string {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }

  avatarClass(idx: number): string {
    const cls = ['rh-av-a', 'rh-av-b', 'rh-av-c', 'rh-av-d', 'rh-av-e', 'rh-av-f'];
    return cls[idx % cls.length];
  }

  shortLocation(name: string): string {
    return name.split(',').slice(0, 2).join(',').trim();
  }

  formatFare(fare: number | null): string {
    return fare ? `₹${fare.toFixed(0)}` : '—';
  }

  tripStatus(trip: DriverHistoryDto): 'completed' | 'pending' | 'cancelled' {
    if (trip.passengers.length === 0) return 'cancelled';
    if (trip.passengers.some(p => p.fare !== null)) return 'completed';
    return 'pending';
  }

  trackByTrip(_: number, t: DriverHistoryDto): string {
    return t.driverHistoryId;
  }
}
