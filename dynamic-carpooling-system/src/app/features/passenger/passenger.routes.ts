import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth-guard';
import { roleGuard } from '../../core/guards/role-guard';

export const PASSENGER_ROUTES: Routes = [
  {
    path: 'passenger/landing',
    canActivate: [authGuard, roleGuard('Passenger')],
    loadComponent: () =>
      import('./pages/passenger-landing-page/passenger-landing-page')
        .then(m => m.PassengerLandingPage)
  },
  {
    path: 'passenger/ride-selection',
    canActivate: [authGuard, roleGuard('Passenger')],
    loadComponent: () =>
      import('./pages/passenger-ride-selection-page/passenger-ride-selection-page')
        .then(m => m.PassengerRideSelection)
  },
  {
    path: 'passenger/ride-confirmation',
    canActivate: [authGuard, roleGuard('Passenger')],
    loadComponent: () =>
      import('./pages/passenger-ride-confirmation-page/passenger-ride-confirmation-page')
        .then(m => m.PassengerRideConfirmationPage)
  },
  {
    path: 'passenger/payment',
    canActivate: [authGuard, roleGuard('Passenger')],
    loadComponent: () => 
      import('./pages/passenger-payment-page/passenger-payment-page')
        .then(module => module.PassengerPaymentPage)
  }
];