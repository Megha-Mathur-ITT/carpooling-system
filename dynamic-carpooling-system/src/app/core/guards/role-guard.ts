import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export const roleGuard = (allowedRole: 'Driver' | 'Passenger'): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const token = localStorage.getItem('auth_token');

    if (!token) {
      router.navigate(['/auth/login']);
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);
      const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      if (role === allowedRole) {
        return true;
      }

      role === 'Driver'
        ? router.navigate(['/driver/landing'])
        : router.navigate(['/passenger/landing']);

      return false;
    } catch {
      router.navigate(['/auth/login']);
      return false;
    }
  };
};