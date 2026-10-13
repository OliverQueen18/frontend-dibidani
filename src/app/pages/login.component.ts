import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, OAuthProviders } from '../core/auth.service';

type Step = 'login' | 'register' | 'forgot' | 'otp' | 'reset';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="login">
      <div class="card">
        <img src="assets/logo-dibidani.png" alt="Dibidani">

        <ng-container *ngIf="step==='login'">
          <h1>Connexion</h1>
          <p>Accédez à votre espace Dibidani.</p>
          <ng-container *ngTemplateOutlet="oauthBtns"></ng-container>
          <label>E-mail<input [(ngModel)]="email" type="email" name="email" autocomplete="username"></label>
          <label>Mot de passe<input [(ngModel)]="password" type="password" name="password" autocomplete="current-password"></label>
          <button type="button" (click)="login()" [disabled]="busy">{{busy ? 'Connexion...' : 'Se connecter'}}</button>
          <button type="button" class="link" (click)="goForgot()">Mot de passe oublié ?</button>
          <button type="button" class="link" (click)="goRegister('customer')">Créer un compte client</button>
          <button type="button" class="link" (click)="goRegister('vendor')">Créer un compte vendeur</button>
        </ng-container>

        <ng-container *ngIf="step==='register'">
          <h1>{{kind==='vendor' ? 'Compte vendeur' : 'Créer un compte'}}</h1>
          <p *ngIf="kind==='customer'">Inscrivez-vous pour commander et suivre vos livraisons à Bamako.</p>
          <p *ngIf="kind==='vendor'">Ouvrez votre boutique sur Dibidani et vendez au marché de Bamako.</p>
          <div class="kind">
            <button type="button" [class.on]="kind==='customer'" (click)="kind='customer'; msg=''">Client</button>
            <button type="button" [class.on]="kind==='vendor'" (click)="kind='vendor'; msg=''">Vendeur</button>
          </div>
          <ng-container *ngTemplateOutlet="oauthBtns"></ng-container>
          <label>Nom complet<input [(ngModel)]="fullName" name="fullName" autocomplete="name" placeholder="Amadou Diallo"></label>
          <label *ngIf="kind==='vendor'">Nom de la boutique<input [(ngModel)]="shopName" name="shopName" placeholder="Electro Mali"></label>
          <label>E-mail<input [(ngModel)]="email" type="email" name="regEmail" autocomplete="email"></label>
          <label>Téléphone<input [(ngModel)]="phone" name="phone" type="tel" autocomplete="tel" placeholder="+223 70 00 00 00"></label>
          <label *ngIf="kind==='vendor'">Quartier<input [(ngModel)]="district" name="district" placeholder="Hamdallaye, Commune IV"></label>
          <label>Mot de passe<input [(ngModel)]="password" type="password" name="regPassword" autocomplete="new-password"></label>
          <label>Confirmation<input [(ngModel)]="confirm" type="password" name="regConfirm" autocomplete="new-password"></label>
          <button type="button" (click)="register()" [disabled]="busy">{{busy ? 'Création...' : (kind==='vendor' ? 'Créer ma boutique' : 'Créer mon compte')}}</button>
          <button type="button" class="link" (click)="step='login'; msg=''">Déjà inscrit ? Se connecter</button>
        </ng-container>

        <ng-container *ngIf="step==='forgot'">
          <h1>Mot de passe oublié</h1>
          <p>Indiquez l'e-mail ou le téléphone du compte. Un code OTP sera envoyé par SMS et par e-mail.</p>
          <label>E-mail ou téléphone<input [(ngModel)]="identifier" name="identifier" autocomplete="username" placeholder="client@dibidani.ml ou +223 ..."></label>
          <button type="button" (click)="requestOtp()" [disabled]="busy">{{busy ? 'Envoi...' : 'Recevoir le code'}}</button>
          <button type="button" class="link" (click)="step='login'">Retour à la connexion</button>
        </ng-container>

        <ng-container *ngIf="step==='otp'">
          <h1>Code OTP</h1>
          <p>Saisissez le code à 6 chiffres envoyé par SMS et par e-mail.</p>
          <div class="demo" *ngIf="demoCode">Mode démo (SMS Gateway / mail non configurés) : <b>{{demoCode}}</b></div>
          <label>Code<input [(ngModel)]="code" name="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"></label>
          <button type="button" (click)="checkOtp()" [disabled]="busy">{{busy ? 'Vérification...' : 'Valider le code'}}</button>
          <button type="button" class="link" (click)="requestOtp()" [disabled]="busy">Renvoyer le code</button>
          <button type="button" class="link" (click)="step='forgot'">Changer d'identifiant</button>
        </ng-container>

        <ng-container *ngIf="step==='reset'">
          <h1>Nouveau mot de passe</h1>
          <p>Choisissez un mot de passe d'au moins 8 caractères.</p>
          <label>Nouveau mot de passe<input [(ngModel)]="password" type="password" name="newPassword" autocomplete="new-password"></label>
          <label>Confirmation<input [(ngModel)]="confirm" type="password" name="confirm" autocomplete="new-password"></label>
          <button type="button" (click)="savePassword()" [disabled]="busy">{{busy ? 'Enregistrement...' : 'Enregistrer'}}</button>
        </ng-container>

        <small [class.ok]="ok">{{msg}}</small>
        <div class="demo" *ngIf="step==='login' || step==='register'">
          Client : client&#64;dibidani.ml / Client123!<br>
          Vendeur : vendeur&#64;dibidani.ml / Vendeur123!<br>
          Catalogue : catalogue&#64;dibidani.ml / Catalogue123!<br>
          Google / Facebook : {{oauthHint}}
        </div>
      </div>
    </main>
    <ng-template #oauthBtns>
      <div class="oauth" *ngIf="showOauth">
        <button type="button" class="social google" (click)="startGoogle()" [disabled]="busy">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.8c2.3-2.1 3.6-5.2 3.6-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1 7.9-2.9l-3.8-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.4v3.1C3.4 21.4 7.4 24 12 24z"/><path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.4C.5 8.4 0 10.2 0 12s.5 3.6 1.4 5.4l3.9-3.1z"/><path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.6l3.9 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>
          Continuer avec Google
        </button>
        <button type="button" class="social facebook" (click)="startFacebook()" [disabled]="busy">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M22 12.07C22 6.48 17.52 2 11.93 2 6.35 2 1.87 6.48 1.87 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.41V9.84c0-2.38 1.42-3.7 3.6-3.7 1.04 0 2.13.19 2.13.19v2.34h-1.2c-1.18 0-1.55.73-1.55 1.48v1.78h2.64l-.42 2.91h-2.22V22c4.78-.75 8.44-4.91 8.44-9.93z"/></svg>
          Continuer avec Facebook
        </button>
      </div>
      <div class="sep" *ngIf="showOauth"><span>ou par e-mail</span></div>
    </ng-template>
  `,
  styles: [`
    .login{min-height:600px;display:grid;place-items:center;background:#f4f8f6}
    .card{width:min(390px,90vw);background:#fff;padding:30px;border-radius:15px;box-shadow:0 15px 50px #082f2414}
    .card img{width:190px;display:block;margin:auto}
    .card h1{text-align:center}
    .card p{text-align:center;color:#74827d}
    .card label{display:block;margin:12px 0;font-size:13px}
    .card input{display:block;width:100%;box-sizing:border-box;padding:12px;border:1px solid #dce5e1;border-radius:8px;margin-top:5px;letter-spacing:inherit}
    .card input[name=otp]{letter-spacing:8px;font-size:22px;text-align:center;font-weight:800}
    .card button{width:100%;padding:13px;background:#087a47;color:#fff;border:0;border-radius:8px;font-weight:800;margin-top:6px}
    .card button[disabled]{opacity:.6}
    .card button.link{background:none;color:#087a47;font-weight:700;padding:8px}
    .kind{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0 4px}
    .kind button{background:#eef5f1;color:#173b30;font-weight:700}
    .kind button.on{background:#087a47;color:#fff}
    .oauth{display:flex;flex-direction:column;gap:8px;margin:4px 0 8px}
    .card button.social{background:#fff;color:#173b30;border:1px solid #dce5e1;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px}
    .card button.social svg{width:18px;height:18px;flex-shrink:0}
    .card button.social.facebook{background:#1877f2;color:#fff;border-color:#1877f2}
    .sep{display:flex;align-items:center;gap:10px;color:#8a9893;font-size:12px;margin:4px 0 10px}
    .sep::before,.sep::after{content:'';flex:1;height:1px;background:#e5ece9}
    .card small{color:#d65438;display:block;margin-top:10px;min-height:1.2em}
    .card small.ok{color:#087a47}
    .demo{margin-top:18px;background:#fff6e9;border-radius:8px;padding:10px;font-size:11px}
  `]
})
export class LoginComponent implements OnInit {
  step: Step = 'login';
  kind: 'customer' | 'vendor' = 'customer';
  providers: OAuthProviders | null = null;
  email = '';
  fullName = '';
  shopName = '';
  district = '';
  phone = '+223 ';
  identifier = '';
  password = '';
  confirm = '';
  code = '';
  demoCode = '';
  msg = '';
  ok = false;
  busy = false;

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

  get showOauth() { return !!(this.providers?.google?.enabled || this.providers?.facebook?.enabled); }
  get oauthHint() {
    if (this.providers?.mockEnabled && !this.providers.google?.clientId && !this.providers.facebook?.clientId) {
      return 'mode démo (clés Google / Facebook non configurées).';
    }
    return 'utilisez les boutons ci-dessus.';
  }

  ngOnInit() {
    if (this.auth.token()) { this.done(); return; }
    this.auth.oauthProviders().subscribe({ next: p => this.providers = p, error: () => this.providers = null });
  }

  goForgot() {
    this.identifier = this.email;
    this.msg = '';
    this.ok = false;
    this.step = 'forgot';
  }

  goRegister(kind: 'customer' | 'vendor' = 'customer') {
    this.kind = kind;
    this.msg = '';
    this.ok = false;
    this.confirm = '';
    this.password = '';
    this.step = 'register';
  }

  register() {
    const fullName = this.fullName.trim();
    const email = this.email.trim();
    const phone = this.phone.trim();
    const shopName = this.shopName.trim();
    if (!fullName) { this.msg = 'Le nom est obligatoire'; this.ok = false; return; }
    if (this.kind === 'vendor' && !shopName) { this.msg = 'Le nom de la boutique est obligatoire'; this.ok = false; return; }
    if (!email || !email.includes('@')) { this.msg = 'Indiquez un e-mail valide'; this.ok = false; return; }
    if (!/^\+?[0-9 ().-]{8,25}$/.test(phone)) { this.msg = 'Numéro de téléphone invalide'; this.ok = false; return; }
    if (this.password.length < 8) { this.msg = '8 caractères minimum'; this.ok = false; return; }
    if (this.password !== this.confirm) { this.msg = 'Les mots de passe ne correspondent pas'; this.ok = false; return; }
    this.busy = true;
    this.ok = false;
    this.msg = '';
    this.auth.register({
      fullName,
      email,
      phone,
      password: this.password,
      accountType: this.kind === 'vendor' ? 'SELLER' : 'CUSTOMER',
      shopName: this.kind === 'vendor' ? shopName : undefined,
      district: this.kind === 'vendor' ? this.district.trim() : undefined,
    }).subscribe({
      next: () => this.done(),
      error: e => { this.busy = false; this.msg = this.err(e) || e.error?.message || 'Inscription impossible'; }
    });
  }

  startGoogle() {
    if (!this.canStartOauth()) return;
    const clientId = this.providers?.google?.clientId;
    if (!clientId) { this.sendOauth('GOOGLE'); return; }
    this.loadScript('https://accounts.google.com/gsi/client').then(() => {
      const g = (window as any).google?.accounts?.oauth2;
      if (!g) { this.msg = 'Google indisponible dans ce navigateur.'; this.ok = false; return; }
      g.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: (res: any) => {
          if (res?.error || !res?.access_token) { this.busy = false; this.msg = 'Connexion Google annulée.'; this.ok = false; return; }
          this.sendOauth('GOOGLE', { accessToken: res.access_token });
        }
      }).requestAccessToken();
    }).catch(() => { this.msg = 'Impossible de charger Google.'; this.ok = false; });
  }

  startFacebook() {
    if (!this.canStartOauth()) return;
    const appId = this.providers?.facebook?.clientId;
    if (!appId) { this.sendOauth('FACEBOOK'); return; }
    this.loadScript('https://connect.facebook.net/fr_FR/sdk.js').then(() => {
      const fb = (window as any).FB;
      if (!fb) { this.msg = 'Facebook indisponible dans ce navigateur.'; this.ok = false; return; }
      if (!(window as any).__dibidaniFbInit) {
        fb.init({ appId, cookie: true, xfbml: false, version: 'v21.0' });
        (window as any).__dibidaniFbInit = true;
      }
      fb.login((res: any) => {
        const token = res?.authResponse?.accessToken;
        if (!token) { this.busy = false; this.msg = 'Connexion Facebook annulée.'; this.ok = false; return; }
        this.sendOauth('FACEBOOK', { accessToken: token });
      }, { scope: 'email,public_profile' });
    }).catch(() => { this.msg = 'Impossible de charger Facebook.'; this.ok = false; });
  }

  login() {
    this.busy = true;
    this.ok = false;
    this.msg = '';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.done(),
      error: e => { this.busy = false; this.msg = e.error?.message || 'Connexion impossible'; }
    });
  }

  requestOtp() {
    const identifier = (this.identifier || this.email).trim();
    if (!identifier) { this.msg = 'Indiquez votre e-mail ou votre téléphone'; this.ok = false; return; }
    this.identifier = identifier;
    this.busy = true;
    this.ok = false;
    this.msg = '';
    this.auth.forgotPassword(identifier).subscribe({
      next: r => {
        this.busy = false;
        this.demoCode = r.demoCode || '';
        this.code = this.demoCode || '';
        this.ok = true;
        this.msg = r.message;
        this.step = 'otp';
      },
      error: e => { this.busy = false; this.msg = e.error?.message || 'Envoi impossible'; }
    });
  }

  checkOtp() {
    if (!/^[0-9]{6}$/.test(this.code)) { this.msg = 'Le code comporte 6 chiffres'; this.ok = false; return; }
    this.busy = true;
    this.ok = false;
    this.msg = '';
    this.auth.verifyResetOtp(this.identifier, this.code).subscribe({
      next: () => { this.busy = false; this.password = ''; this.confirm = ''; this.step = 'reset'; },
      error: e => { this.busy = false; this.msg = this.err(e) || 'Code invalide ou expiré'; }
    });
  }

  savePassword() {
    if (this.password.length < 8) { this.msg = '8 caractères minimum'; this.ok = false; return; }
    if (this.password !== this.confirm) { this.msg = 'Les mots de passe ne correspondent pas'; this.ok = false; return; }
    this.busy = true;
    this.ok = false;
    this.msg = '';
    this.auth.resetPassword(this.identifier, this.code, this.password).subscribe({
      next: () => {
        this.busy = false;
        this.email = this.identifier.includes('@') ? this.identifier : this.email;
        this.password = '';
        this.confirm = '';
        this.code = '';
        this.demoCode = '';
        this.ok = true;
        this.msg = 'Mot de passe mis à jour. Connectez-vous.';
        this.step = 'login';
      },
      error: e => { this.busy = false; this.msg = this.err(e) || 'Réinitialisation impossible'; }
    });
  }

  private canStartOauth(): boolean {
    if (this.step === 'register' && this.kind === 'vendor' && !this.shopName.trim()) {
      this.msg = 'Indiquez d’abord le nom de la boutique';
      this.ok = false;
      return false;
    }
    return true;
  }

  private sendOauth(provider: 'GOOGLE' | 'FACEBOOK', tokens: {accessToken?: string; idToken?: string} = {}) {
    this.busy = true;
    this.ok = false;
    this.msg = '';
    this.auth.oauth({
      provider,
      idToken: tokens.idToken || (tokens.accessToken ? undefined : 'mock'),
      accessToken: tokens.accessToken,
      accountType: this.step === 'register' && this.kind === 'vendor' ? 'SELLER' : 'CUSTOMER',
      shopName: this.kind === 'vendor' ? this.shopName.trim() : undefined,
      district: this.kind === 'vendor' ? this.district.trim() : undefined,
    }).subscribe({
      next: () => this.done(),
      error: e => { this.busy = false; this.msg = this.err(e) || e.error?.message || 'Connexion sociale impossible'; }
    });
  }

  private done() {
    this.router.navigateByUrl(this.auth.afterLoginPath(this.route.snapshot.queryParamMap.get('returnUrl')));
  }

  private loadScript(src: string) {
    return new Promise<void>((resolve, reject) => {
      if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject();
      document.head.appendChild(s);
    });
  }

  private err(e: any): string {
    if (typeof e.error === 'string') {
      try { return JSON.parse(e.error).message; } catch { return ''; }
    }
    return e.error?.message || '';
  }
}
