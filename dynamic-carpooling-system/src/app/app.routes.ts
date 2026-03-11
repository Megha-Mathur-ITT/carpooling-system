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
        path: '**',
        loadComponent: () =>
            import('./core/page-not-found/page-not-found').then(module => module.PageNotFound)
    },
];
