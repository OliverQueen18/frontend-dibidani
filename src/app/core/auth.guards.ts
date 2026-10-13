import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.token()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const staffGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.token() && auth.isStaff()) return true;
  if (!auth.token()) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  return router.createUrlTree(['/account']);
};

export const permissionGuard = (...permissions: string[]): CanActivateFn => (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token()) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  if (auth.canAny(...permissions)) return true;
  return router.createUrlTree(['/admin']);
};
