import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-payment-confirm',
  imports: [],
  templateUrl: './payment-confirm.html',
  styleUrl: './payment-confirm.scss',
})
export class PaymentConfirm {
  @Input() activeRide: any = null;

  @Output() confirmed = new EventEmitter<void>();
  @Output() denied = new EventEmitter<void>();
}
