import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { DRIVER_ROUTES } from './features/driver/driver.routes';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./landing/home/home').then(module => module.Home)
    },
    {
        path: 'auth/login',
        loadComponent: () =>
            import('./features/auth/login/login').then(module => module.Login)
    },
    {
        path: 'auth/register',
        loadComponent: () =>
            import('./features/auth/register/register').then(module => module.Register)
    },
    ...DRIVER_ROUTES,
    {
        path: 'passenger/landing',
        loadComponent: () => 
            import('./passenger/passenger-landing-page/passenger-landing-page').then(module => module.PassengerLandingPage)
    },
    {
        path: 'passenger/ride-selection',
        loadComponent: () => 
            import('./passenger/passenger-ride-selection/passenger-ride-selection').then(module => module.PassengerRideSelection)
    },
    {
        path: '**',
        loadComponent: () =>
            import('./core/page-not-found/page-not-found').then(module => module.PageNotFound)
    },
];
