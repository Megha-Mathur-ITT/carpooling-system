import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  imports: [CommonModule, RouterLink],
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean | null = null;
  userRole: any = null;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();

    this.authService.loggedInUserRole.subscribe(role => {
      this.isLoggedIn = role !== null;
      this.userRole = role;
    });
  }

  navigateToLogin() { this.router.navigate(['/auth/login']); }
  navigateToRegister() { this.router.navigate(['/auth/register']); }
  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  isCollapsed = true;

  navigateToHistory() {
    if (this.userRole === 1) {
      this.router.navigate(['/passenger/history']);
    } else if (this.userRole === 2) {
      this.router.navigate(['/driver/history']);
    }
  }
}