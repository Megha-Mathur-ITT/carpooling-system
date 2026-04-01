import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trimLocation } from '../../../../../shared/utils/locationUtil';
import { SignalrService } from '../../../../../core/services/signalr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ride-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ride-status.html',
  styleUrl: './ride-status.scss',
})
export class RideStatus {
  @Input() driver: any = null;
  @Input() destination: any = null;
  @Input() mapComponent: any = null;
  @Input() isDriverArrived = false;
  @Input() isRideStarted = false;
  @Input() isReachedDestination = false;
  @Input() isPinVerified = false;
  @Input() isPinFailed = false;
  @Input() pinAttempts = 0;

  @Output() onPayDriver = new EventEmitter<void>();

  private locationSubscription?: Subscription;
  readonly trimLocation = trimLocation;
  readonly maxPinAttempts = 3;

  constructor(private signalrService: SignalrService) { }

  ngOnInit() {
    this.locationSubscription = this.signalrService.locationUpdate$.subscribe(data => {
      if (this.mapComponent && this.mapComponent.driverMarker) {
        this.mapComponent.driverMarker.setLatLng([data.latitude, data.longitude]);
      }
    });
  }

  ngOnDestroy() {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
  }
}