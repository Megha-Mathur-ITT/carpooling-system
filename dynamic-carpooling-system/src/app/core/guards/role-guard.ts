import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

export const roleGuard = (allowedRole: 'Driver' | 'Passenger'): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return true;
    }

    const token = localStorage.getItem('auth_token');

    if (!token) {
      router.navigate(['/auth/login']);
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);
      const role = decoded['role'];

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