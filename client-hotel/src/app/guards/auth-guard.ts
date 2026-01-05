import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../services/auth';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // On server-side, allow the route (will be checked again on client)
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // On client-side, check authentication
  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const roleGuard = (requiredRole: string): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    // On server-side, allow the route (will be checked again on client)
    if (!isPlatformBrowser(platformId)) {
      return true;
    }

    // On client-side, check authentication and role
    if (authService.isAuthenticated() && authService.hasRole(requiredRole)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};
