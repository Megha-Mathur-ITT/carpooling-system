import {
  Component, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { RideHistoryService } from '../../../../core/services/ride-history.service';
import { DriverHistoryPassengerDto } from '../../../../core/models/ride-history.model';
 
@Component({
  selector: 'app-passenger-history',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './passenger-history.html',
  styleUrls: ['./passenger-history.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassengerHistory implements OnInit {
 
  history: DriverHistoryPassengerDto[] = [];
  isLoading = true;
  errorMsg: string | null = null;
 
  totalRides     = 0;
  ridesThisWeek  = 0;
  avgRating      = 0;
 
  ridesThisMonth = 0;
  lastRideLabel  = '';
 
  ratingOpenId: string | null = null;
  hoverRating  = 0;
  isRating     = false;
 
  constructor(
    private historyService: RideHistoryService,
    private cdr: ChangeDetectorRef,
  ) {}
 
  ngOnInit(): void {
    this.loadHistory();
  }
 
  private loadHistory(): void {
    this.isLoading = true;
    this.errorMsg  = null;
 
    this.historyService.getPassengerHistory().subscribe({
      next: (data) => {
        this.history = data.sort((a, b) => {
          const ta = a.pickupTime ? new Date(a.pickupTime).getTime() : 0;
          const tb = b.pickupTime ? new Date(b.pickupTime).getTime() : 0;
          return tb - ta;
        });
        this.computeStats();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message ?? 'Failed to load ride history.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
 
  private computeStats(): void {
    this.totalRides = this.history.length;
 
    const now     = new Date();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
 
    this.ridesThisWeek = this.history.filter(
      h => h.pickupTime && new Date(h.pickupTime).getTime() >= weekAgo
    ).length;
 
    this.ridesThisMonth = this.history.filter(h => {
      if (!h.pickupTime) return false;
      const d = new Date(h.pickupTime);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
 
    const lastRide = this.history[0];
    if (lastRide?.pickupTime) {
      const d = new Date(lastRide.pickupTime);
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      this.lastRideLabel = isToday
        ? 'Last ride today'
        : `Last ride ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
    } else {
      this.lastRideLabel = 'No rides yet';
    }
 
    const rated = this.history
      .map(h => h.ratings)
      .filter((r): r is number => r !== null);
    this.avgRating = rated.length
      ? +(rated.reduce((s, r) => s + r, 0) / rated.length).toFixed(1)
      : 0;
  }
 
  toggleRatingPanel(id: string): void {
    this.ratingOpenId = this.ratingOpenId === id ? null : id;
    this.hoverRating  = 0;
    this.cdr.markForCheck();
  }
 
  submitRating(entry: DriverHistoryPassengerDto, star: number): void {
    if (this.isRating) return;
    this.isRating = true;
 
    this.historyService.rateDriver(entry.passengerHistoryId, star).subscribe({
      next: (updated) => {
        const idx = this.history.findIndex(
          h => h.passengerHistoryId === updated.passengerHistoryId
        );
        if (idx !== -1) this.history[idx] = { ...this.history[idx], ratings: updated.ratings };
        this.ratingOpenId = null;
        this.hoverRating  = 0;
        this.isRating     = false;
        this.computeStats();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isRating = false;
        this.cdr.markForCheck();
      },
    });
  }
 
  monthLabel(isoDate: string | null): string {
    if (!isoDate) return 'Unknown';
    return new Date(isoDate).toLocaleDateString('en-IN', {
      month: 'long', year: 'numeric',
    });
  }
 
  formatDate(isoDate: string | null): string {
    if (!isoDate) return '—';
    const d     = new Date(isoDate);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return isToday
      ? `Today, ${time}`
      : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + `, ${time}`;
  }
 
  shortLocation(name: string | null | undefined): string {
    if (!name) return 'Unknown';
    return name.split(',').slice(0, 2).join(',').trim();
  }
 
  initials(name: string): string {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
 
  formatFare(fare: number | null): string {
    return fare ? `₹${fare.toFixed(0)}` : '—';
  }
 
  avatarClass(idx: number): string {
    const cls = ['rh-av-a', 'rh-av-b', 'rh-av-c', 'rh-av-d', 'rh-av-e', 'rh-av-f'];
    return cls[idx % cls.length];
  }
 
  get stars(): number[] { return [1, 2, 3, 4, 5]; }
 
  rideStatus(entry: DriverHistoryPassengerDto): 'completed' | 'cancelled' {
    return entry.fare !== null ? 'completed' : 'cancelled';
  }
 
  trackByEntry(_: number, e: DriverHistoryPassengerDto): string {
    return e.passengerHistoryId;
  }
}
