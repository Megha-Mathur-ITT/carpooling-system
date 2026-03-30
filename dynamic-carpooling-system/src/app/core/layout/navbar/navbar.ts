import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth-service';
import { RideSessionService } from '../../../features/driver/services/ride-session'; // ← adjust path
import { PassengerListComponent } from '../../../shared/components/passenger-list/passenger-list';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  imports: [CommonModule, RouterLink, PassengerListComponent],
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean | null = null;
  userRole: any = null;
  isDriverOnline = false;
  isCollapsed = true;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private rideSessionService: RideSessionService
  ) { }

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    this.authService.loggedInUserRole
      .pipe(takeUntil(this.destroy$))
      .subscribe(role => {
        this.isLoggedIn = role !== null;
        this.userRole = role;
      });

    this.rideSessionService.isOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(online => {
        this.isDriverOnline = online;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToLogin() { this.router.navigate(['/auth/login']); }
  navigateToRegister() { this.router.navigate(['/auth/register']); }

  logout() {
    this.authService.logout();
    this.rideSessionService.isOnline$.next(false); 
    this.router.navigate(['/']);
  }

  navigateToHistory() {
    if (this.userRole === 1) {
      this.router.navigate(['/passenger/history']);
    } else if (this.userRole === 2) {
      this.router.navigate(['/driver/history']);
    }
  }
}