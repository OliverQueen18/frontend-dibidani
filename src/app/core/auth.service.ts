import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface AuthUser {
  token: string | null;
  tokenType?: string;
  expiresIn?: number;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
  staff: boolean;
  shopId?: number | null;
  shopName?: string | null;
  shopSlug?: string | null;
}

export interface OAuthProviderInfo { enabled: boolean; clientId?: string | null; }
export interface OAuthProviders { mockEnabled: boolean; google: OAuthProviderInfo; facebook: OAuthProviderInfo; }

const TOKEN_KEY = 'dibidani_token';
const USER_KEY = 'dibidani_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  user = signal<AuthUser | null>(readUser());
  permissions = computed(() => this.user()?.permissions ?? []);
  staff = computed(() => !!this.user()?.staff);

  constructor(private http: HttpClient, private router: Router) {}

  login(v: { email: string; password: string }) {
    return this.http.post<AuthUser>('/api/v1/auth/login', v, { withCredentials: true }).pipe(tap(r => this.set(r)));
  }

  register(v: unknown) {
    return this.http.post<AuthUser>('/api/v1/auth/register', v, { withCredentials: true }).pipe(tap(r => this.set(r)));
  }

  oauthProviders() {
    return this.http.get<OAuthProviders>('/api/v1/auth/oauth/providers');
  }

  oauth(body: {provider: string; idToken?: string; accessToken?: string; accountType?: string; shopName?: string; district?: string}) {
    return this.http.post<AuthUser>('/api/v1/auth/oauth', body, { withCredentials: true }).pipe(tap(r => this.set(r)));
  }

  forgotPassword(identifier: string) {
    return this.http.post<ForgotPasswordResponse>('/api/v1/auth/forgot-password', { identifier }, { withCredentials: true });
  }

  verifyResetOtp(identifier: string, code: string) {
    return this.http.post('/api/v1/auth/verify-reset-otp', { identifier, code }, { withCredentials: true, responseType: 'text' });
  }

  resetPassword(identifier: string, code: string, newPassword: string) {
    return this.http.post('/api/v1/auth/reset-password', { identifier, code, newPassword }, { withCredentials: true, responseType: 'text' });
  }

  refresh() {
    return this.http.post<AuthUser>('/api/v1/auth/refresh', {}, { withCredentials: true }).pipe(tap(r => this.set(r)));
  }

  logout() {
    this.http.post('/api/v1/auth/logout', {}, { withCredentials: true }).subscribe({ error: () => {} });
    this.clear();
    this.router.navigateByUrl('/');
  }

  can(permission: string) { return this.permissions().includes(permission); }

  canAny(...permissions: string[]) { return permissions.some(p => this.can(p)); }

  isStaff() { return this.staff(); }

  isSeller() { return this.user()?.role === 'SELLER'; }

  isAdmin() { return this.user()?.role === 'ADMIN' || this.can('DASHBOARD_VIEW'); }

  homePath() { return this.isStaff() ? '/admin' : '/account'; }

  afterLoginPath(returnUrl?: string | null) {
    const home = this.homePath();
    if (!returnUrl || returnUrl === '/' || returnUrl.startsWith('/login')) return home;
    if (returnUrl.startsWith('/admin') && !this.isStaff()) return home;
    if (this.isStaff() && (returnUrl === '/account' || returnUrl.startsWith('/account?'))) return home;
    return returnUrl;
  }

  private set(r: AuthUser) {
    localStorage.setItem(TOKEN_KEY, r.token || '');
    localStorage.setItem(USER_KEY, JSON.stringify({ ...r, token: undefined }));
    this.token.set(r.token);
    this.user.set(r);
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
  }
}

export interface ForgotPasswordResponse {
  message: string;
  expiresInSeconds: number;
  emailSent: boolean;
  smsSent: boolean;
  demoCode?: string | null;
}

function readUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}
