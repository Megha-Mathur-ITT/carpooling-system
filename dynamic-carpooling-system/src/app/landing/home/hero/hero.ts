import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth-service';
import { UserRole } from '../../../core/models/auth-model';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hero',
  imports: [NgIf],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  userRole: UserRole | null = null;

  constructor(public authService: AuthService, private router: Router) {

  }

  ngOnInit() {
    this.authService.loggedInUserRole.subscribe(role => {
      this.userRole = role;
    });
  }

  goToPassengerPage() {
    this.router.navigate(['/passenger/landing'])
  }

  goToDriver() {

  }
}
