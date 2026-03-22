import { Component , Input} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-passenger-details',
  imports: [CommonModule],
  templateUrl: './passenger-details.html',
  styleUrl: './passenger-details.scss',
})
export class PassengerDetails {
  @Input() ride : any;

  @Input() distance: number = 0;
  @Input() eta: number = 0;
  @Input() fare: number = 0;

}