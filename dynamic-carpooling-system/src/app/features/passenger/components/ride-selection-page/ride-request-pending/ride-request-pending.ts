import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-ride-request-pending',
  imports: [CommonModule],
  templateUrl: './ride-request-pending.html',
  styleUrl: './ride-request-pending.scss',
})
export class RideRequestPending {
  @Input() driverName: string = '';
  @Output() onCancel = new EventEmitter<void>();
}
