import { Component } from '@angular/core';
import { MapComponent } from '../../../../shared/components/map/map';
import { NavbarComponent } from '../../../../core/layout/navbar/navbar';
import { Footer } from '../../../../core/layout/footer/footer';
import { Toggler } from '../../components/toggler/toggler';
import { RideForm } from '../../components/ride-form/ride-form';
import { OfflineTogglerPage } from '../../components/offline-toggler-page/offline-toggler-page';

@Component({
  selector: 'app-driver-landing',
  imports: [MapComponent , NavbarComponent , Footer, Toggler , RideForm ,  OfflineTogglerPage],
  templateUrl: './driver-landing.html',
  styleUrl: './driver-landing.scss',
})
export class DriverLanding {

}
