import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { noAuthGuard } from './core/guards/no-auth-guard';
import { DRIVER_ROUTES } from './features/driver/driver.routes';
import { PASSENGER_ROUTES } from './features/passenger/passenger.routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./landing/home/home').then(m => m.Home)
  },
  {
    path: 'auth/login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'auth/register',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/register/register').then(m => m.Register)
  },
  ...DRIVER_ROUTES,
  ...PASSENGER_ROUTES,
  {
    path: '**',
    loadComponent: () =>
      import('./core/page-not-found/page-not-found').then(m => m.PageNotFound)
  }
];