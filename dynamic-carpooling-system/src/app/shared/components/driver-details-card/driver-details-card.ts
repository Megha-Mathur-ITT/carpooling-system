import { Component, EventEmitter, Input, Output } from '@angular/core';

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

  @Output() onRequestRide  = new EventEmitter<void>()

  requestRideHandler(event: Event) {
    this.onRequestRide.emit();
    event.stopPropagation()
  }
}
