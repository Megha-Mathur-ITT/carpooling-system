import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./landing/home/home').then(m => m.Home)
    },

    {
        path: 'auth/login',
        loadComponent: () =>
            import('./features/auth/login/login').then(m => m.Login)
    },

    {
        path: 'auth/register',
        loadComponent: () =>
            import('./features/auth/register/register').then(m => m.Register)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
