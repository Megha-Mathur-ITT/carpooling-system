import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-splash',
  standalone: true,
  templateUrl: './splash.html',
  styleUrls: ['./splash.scss'],
})
export class Splash implements OnInit {
  @Output() splashFinished = new EventEmitter<void>();

  displayText: string = '';
  fullTextHindi: string = 'सफ़र';
  fullTextEnglish: string = 'Safer';

  ngOnInit(): void {
    this.typeText(this.fullTextHindi, 120, () => {
      setTimeout(() => {
        this.backspaceText(this.fullTextHindi.length, 80, () => {
          this.typeText(this.fullTextEnglish, 120, () => {
            setTimeout(() => this.splashFinished.emit(), 600);
          });
        });
      }, 1000);
    });
  }

  private typeText(text: string, speed: number, callback?: () => void): void {
    let index = 0;
    const interval = setInterval(() => {
      this.displayText = text.slice(0, index + 1);
      index++;
      if (index === text.length) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, speed);
  }

  private backspaceText(length: number, speed: number, callback?: () => void): void {
    let index = length;
    const interval = setInterval(() => {
      this.displayText = this.displayText.slice(0, index - 1);
      index--;
      if (index <= 0) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, speed);
  }
}
