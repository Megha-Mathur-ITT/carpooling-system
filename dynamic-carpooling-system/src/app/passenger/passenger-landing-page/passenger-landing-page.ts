import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { LocationTrackingService } from '../../core/services/location-tracking-service';
import { NavbarComponent } from '../../core/layout/navbar/navbar';
import { Footer } from '../../core/layout/footer/footer';

@Component({
  selector: 'app-passenger-landing-page',
  imports: [NavbarComponent, Footer],
  templateUrl: './passenger-landing-page.html',
  styleUrl: './passenger-landing-page.scss',
})
export class PassengerLandingPage {
  city: string = '';
  state: string = '';

  constructor(private router: Router, private locationTrackingService: LocationTrackingService, private changeDetectorRef: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.detectLocation();
  }

  detectLocation() {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      this.fetchLocation(latitude, longitude);
    });
  }

  fetchLocation(latitude: number, longitude: number) {
    this.locationTrackingService.getLocationFromCoordinates(latitude, longitude)
      .subscribe(response => {
        this.city = response.location.city;
        this.state = response.location.state;

        this.changeDetectorRef.detectChanges();
      })
  }

  goToRideSelectionPage() {
    this.router.navigate(['/passenger/ride-selection']);
  }
}
