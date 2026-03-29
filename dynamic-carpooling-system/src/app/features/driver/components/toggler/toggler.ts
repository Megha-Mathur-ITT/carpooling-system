import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggler',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggler.html',
  styleUrls: ['./toggler.scss']
})
export class Toggler {
  @Input() isOnline = false;
}