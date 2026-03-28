import { CommonModule, NgClass } from '@angular/common';
import { Component  } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, NgClass],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  isCollapsed = true;
}
