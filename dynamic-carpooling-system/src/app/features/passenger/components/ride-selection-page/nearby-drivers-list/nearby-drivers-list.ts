import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DriverDetailsCard } from '../../../../../shared/components/driver-details-card/driver-details-card';

@Component({
  selector: 'app-nearby-drivers-list',
  imports: [CommonModule, DriverDetailsCard],
  templateUrl: './nearby-drivers-list.html',
  styleUrl: './nearby-drivers-list.scss',
})
export class NearbyDriversList {
  @Input() drivers: any[] = [];
  @Input() isLoading = false;
  @Input() selectedDriver: any = null;

  @Output() driverSelected = new EventEmitter<any>();
  @Output() rideRequested = new EventEmitter<any>();
}
