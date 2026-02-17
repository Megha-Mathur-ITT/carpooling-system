import { Component } from '@angular/core';
import { NavbarComponent } from '../../core/layout/navbar/navbar';
import { Hero } from "./hero/hero";
import { HowItWorks } from "./how-it-works/how-it-works";
import { Footer } from "../../core/layout/footer/footer";
import { Features } from "./features/features";
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NavbarComponent, Hero, HowItWorks, Footer, Features],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
