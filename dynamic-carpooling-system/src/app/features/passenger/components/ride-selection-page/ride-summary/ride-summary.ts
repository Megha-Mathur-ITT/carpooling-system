import { CommonModule } from '@angular/common';
import { Component, Input} from '@angular/core';

@Component({
  selector: 'app-ride-summary',
  imports: [CommonModule],
  templateUrl: './ride-summary.html',
  styleUrl: './ride-summary.scss',
})
export class RideSummary {
  @Input() pickup: any = null;
  @Input() destination: any = null;
}
