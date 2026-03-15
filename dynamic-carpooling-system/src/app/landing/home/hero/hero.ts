import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  isLoggedIn = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
    this.authService.loggedInUserRole.subscribe(role => {
      this.userRole = role;
      this.isLoggedIn = role !== null;
      this.changeDetectorRef.markForCheck();
    });
  }

  goToPassengerPage() {
    this.router.navigate(['/passenger/landing'])
  }

  goToDriver() {

  }
}
