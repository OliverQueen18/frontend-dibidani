import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

let refreshing: ReturnType<AuthService['refresh']> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const withCreds = req.url.includes('/api/v1/auth/')
    ? req.clone({ withCredentials: true })
    : req;
  const authed = token && !req.headers.has('Authorization')
    ? withCreds.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : withCreds;
  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || authed.url.includes('/api/v1/auth/')) return throwError(() => err);
      if (!refreshing) refreshing = auth.refresh();
      return refreshing.pipe(
        switchMap(r => {
          refreshing = null;
          return next(authed.clone({ setHeaders: { Authorization: `Bearer ${r.token}` } }));
        }),
        catchError(refreshErr => {
          refreshing = null;
          auth.clear();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
