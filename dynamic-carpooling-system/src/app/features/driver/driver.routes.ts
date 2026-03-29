import { Routes } from '@angular/router';
import { DriverLanding } from './pages/driver-landing/driver-landing';
import { DriverDashboard} from './pages/driver-dashboard/driver-dashboard';
import { DriverRideActive } from '../driver/pages/driver-ride-active/driver-ride-active';
import { TripDetails } from '../driver/pages/trip-details/trip-details';
import { authGuard } from '../../core/guards/auth-guard';
import { roleGuard } from '../../core/guards/role-guard'; 

export const DRIVER_ROUTES: Routes = [
  {
    path: 'driver',
    canActivate: [authGuard, roleGuard('Driver')],
    children: [
      { path: 'landing', component: DriverLanding},
      { path: 'dashboard', component: DriverDashboard },
      {path : 'ride-active' , component :DriverRideActive},
      { path: 'trip-details', component: TripDetails},
    ]
  },
  {
    path: 'driver/receipt',
    canActivate: [authGuard, roleGuard('Driver')],
    loadComponent: () =>
      import('../../shared/components/ride-receipt/ride-receipt')
        .then(module => module.RideReceipt)
  },
  {
    path: 'driver/history',
    canActivate: [authGuard, roleGuard('Driver')],
    loadComponent: () =>
      import('./pages/driver-history/driver-history')
        .then(module => module.DriverHistory)
  }
];  