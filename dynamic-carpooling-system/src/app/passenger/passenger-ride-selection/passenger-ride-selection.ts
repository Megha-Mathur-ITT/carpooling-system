import { Component } from '@angular/core';
import { NavbarComponent } from '../../core/layout/navbar/navbar';
import { Footer } from '../../core/layout/footer/footer';
import { DriverDetailsCard } from '../../shared/components/driver-details-card/driver-details-card';

@Component({
  selector: 'app-passenger-ride-selection',
  imports: [NavbarComponent, Footer, DriverDetailsCard],
  templateUrl: './passenger-ride-selection.html',
  styleUrl: './passenger-ride-selection.scss',
})
export class PassengerRideSelection {
  
}
