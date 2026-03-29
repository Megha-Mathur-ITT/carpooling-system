import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

export const noAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem('auth_token');

  if (!token) {
    return true;
  }

  try {
    const decoded: any = jwtDecode(token);
    const role = decoded['role'];
    
    role === 'Driver'
      ? router.navigate(['/driver/landing'])
      : router.navigate(['/passenger/landing']);
  } catch {
    router.navigate(['/']);
  }

  return false;
};