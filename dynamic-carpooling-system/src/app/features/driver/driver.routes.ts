import { Routes } from '@angular/router';
import { DriverLanding } from './pages/driver-landing/driver-landing';
import { DriverDashboard} from './pages/driver-dashboard/driver-dashboard';
import { authGuard } from '../../core/guards/auth-guard';

export const DRIVER_ROUTES: Routes = [
  {
    path: 'driver',
    // canActivate : [authGuard],
    children: [
      { path: 'landing', component: DriverLanding},
      { path: 'dashboard', component: DriverDashboard }
    ]
  }
];