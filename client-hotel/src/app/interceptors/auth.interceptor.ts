import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError, timeout, tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next(authReq).pipe(
        timeout(30000),
        catchError((error: any) => {
          if (error.status === 401) {
            console.error('🔐 Unauthorized request:', req.url);
          }
          return throwError(() => error);
        })
      );
    }
  }

  return next(req).pipe(
    timeout(30000),
    catchError((error: any) => {
      return throwError(() => error);
    })
  );
};