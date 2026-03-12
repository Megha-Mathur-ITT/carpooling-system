import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'app-driver-details-card',
  standalone: true,
  imports: [],
  templateUrl: './driver-details-card.html',
  styleUrl: './driver-details-card.scss',
})
export class DriverDetailsCard {
  @Input() driverName!: string;
  @Input() vehicleName!: string; 
  @Input() rating!: number;
  @Input() fare!: string;
  @Input() eta!: string;

}
