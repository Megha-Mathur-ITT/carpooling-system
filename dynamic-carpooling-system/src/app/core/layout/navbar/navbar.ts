
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  imports: [CommonModule, RouterLink],
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent {
  isLoggedIn = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {

  }

  ngOnInit() {
    this.authService.loggedInUserRole.subscribe(role => {
      this.isLoggedIn = role !== null;
    });
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  isCollapsed = true;
}