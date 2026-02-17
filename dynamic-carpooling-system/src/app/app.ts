import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf, CommonModule } from '@angular/common';
import { Splash } from './landing/splash/splash';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf, RouterOutlet, CommonModule, Splash],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('dynamic-carpooling-system');
  showSplash = true;

  onSplashFinished() {
    this.showSplash = false;
  }
}
