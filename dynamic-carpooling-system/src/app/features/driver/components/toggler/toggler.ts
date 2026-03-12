import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-toggler',
  standalone: true,
  imports: [FormsModule],  
  templateUrl: './toggler.html',
  styleUrls: ['./toggler.scss']
})
export class Toggler {

  isActive = false;

  toggleStatus() {

    if (this.isActive) {
      console.log("Driver Active - Let's Go &#65039;");
    } else {
      console.log("Driver Offline &#x26D4;");
    }

  }
  
}