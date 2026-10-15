import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ProductPublishService } from '../core/product-publish.service';
import { ProductPublishDialogComponent } from '../shared/product-publish-dialog.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ProductPublishDialogComponent],
  template: `
<main class="shell" [class.menu-open]="menuOpen">
  <header class="topbar">
    <button type="button" class="burger" (click)="toggleMenu()" [attr.aria-expanded]="menuOpen" aria-controls="admin-menu" [attr.aria-label]="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'">{{menuOpen ? '✕' : '☰'}}</button>
    <a routerLink="/admin" class="top-brand" (click)="closeMenu()"><img src="assets/logo-dibidani.png" alt="Dibidani"></a>
    <button class="top-pub" type="button" *ngIf="auth.can('CATALOG_MANAGE')" (click)="publish.openNew()">+ Publier</button>
  </header>
  <div class="backdrop" *ngIf="menuOpen" (click)="closeMenu()"></div>
  <aside id="admin-menu">
    <div class="brand"><img src="assets/logo-dibidani.png" alt="Dibidani"></div>
    <p class="who"><b>{{auth.user()?.fullName}}</b><small>{{roleLabel}}</small></p>
    <button class="publish" type="button" *ngIf="auth.can('CATALOG_MANAGE')" (click)="publish.openNew(); closeMenu()">+ Publier un produit</button>
    <nav>
      <a routerLink="/admin" routerLinkActive="on" [routerLinkActiveOptions]="{exact:true}">Tableau de bord</a>
      <a routerLink="/admin/contenu" routerLinkActive="on" *ngIf="auth.canAny('SETTINGS_MANAGE','ADS_MANAGE')">Contenu du site</a>
      <a routerLink="/admin/contenu" [queryParams]="{tab:'SOCIAL'}" class="sub" *ngIf="auth.canAny('SETTINGS_MANAGE','ADS_MANAGE')">Réseaux sociaux</a>
      <a routerLink="/admin/contenu" [queryParams]="{tab:'HOME'}" class="sub" *ngIf="auth.canAny('SETTINGS_MANAGE','ADS_MANAGE')">Page d'accueil</a>
      <a routerLink="/admin/contenu" [queryParams]="{tab:'MENU'}" class="sub" *ngIf="auth.canAny('SETTINGS_MANAGE','ADS_MANAGE')">Menus</a>
      <a routerLink="/admin/contenu" [queryParams]="{tab:'FAQ'}" class="sub" *ngIf="auth.canAny('SETTINGS_MANAGE','ADS_MANAGE')">FAQ</a>
      <a routerLink="/admin/produits" routerLinkActive="on" *ngIf="auth.can('CATALOG_VIEW')">Produits</a>
      <a routerLink="/admin/categories" routerLinkActive="on" *ngIf="auth.can('CATALOG_VIEW')">Catégories</a>
      <a routerLink="/admin/marques" routerLinkActive="on" *ngIf="auth.can('CATALOG_VIEW')">Marques</a>
      <a routerLink="/admin/vendeurs" routerLinkActive="on" *ngIf="auth.can('CATALOG_VIEW')">Vendeurs</a>
      <a routerLink="/admin/commandes" routerLinkActive="on" *ngIf="auth.can('ORDERS_MANAGE')">Commandes</a>
      <a routerLink="/admin/clients" routerLinkActive="on" *ngIf="auth.can('CUSTOMERS_VIEW')">Clients</a>
      <a routerLink="/admin/paiements" routerLinkActive="on" *ngIf="auth.can('PAYMENTS_MANAGE')">Paiements</a>
      <a routerLink="/admin/livraisons" routerLinkActive="on" *ngIf="auth.can('DELIVERIES_MANAGE')">Livraisons</a>
      <a routerLink="/admin/zones" routerLinkActive="on" *ngIf="auth.can('DELIVERIES_MANAGE')">Zones</a>
      <a routerLink="/admin/publicites" routerLinkActive="on" *ngIf="auth.can('ADS_MANAGE')">Publicités</a>
      <a routerLink="/admin/promos" routerLinkActive="on" *ngIf="auth.can('PROMOTIONS_MANAGE')">Codes promo</a>
      <a routerLink="/admin/statistiques" routerLinkActive="on" *ngIf="auth.can('REPORTS_VIEW')">Statistiques</a>
      <a routerLink="/admin/utilisateurs" routerLinkActive="on" *ngIf="auth.can('USERS_MANAGE')">Utilisateurs</a>
      <a routerLink="/admin/parametres" routerLinkActive="on" *ngIf="auth.can('SETTINGS_MANAGE')">Paramètres</a>
    </nav>
    <div class="foot">
      <a routerLink="/" class="ghost">Voir le site</a>
      <button type="button" (click)="auth.logout()">Déconnexion</button>
    </div>
  </aside>
  <section class="main">
    <router-outlet></router-outlet>
  </section>
</main>
<app-product-publish-dialog></app-product-publish-dialog>
`,
  styles: [`
.shell{display:grid;grid-template-columns:232px 1fr;min-height:100vh;background:#f4f7f6}
.topbar,.backdrop{display:none}
aside{background:#0a3026;color:#fff;padding:16px;display:flex;flex-direction:column;gap:8px}
.brand{background:#fff;border-radius:9px;padding:6px}
.brand img{width:100%;height:56px;object-fit:contain}
.who{margin:4px 0 8px;display:flex;flex-direction:column}
.who b{font-size:13px}.who small{color:#9cb8ae;font-size:11px}
.publish{border:0;background:#ff7900;color:#fff;border-radius:8px;padding:10px 12px;font-weight:800;cursor:pointer;font-size:13px}
nav{display:flex;flex-direction:column;gap:3px;flex:1;overflow:auto}
nav a{padding:9px 11px;border-radius:7px;color:#c8ded6;font-size:13px;text-decoration:none}
nav a.sub{padding-left:22px;font-size:12px;color:#9cb8ae}
nav a.on{background:#087a47;color:#fff}
.foot{display:flex;flex-direction:column;gap:8px;padding-top:10px;border-top:1px solid #1a4a3c}
.foot a,.foot button{border:0;border-radius:8px;padding:10px;font-weight:800;cursor:pointer;text-align:center;text-decoration:none;font-size:13px}
.foot .ghost{background:#1a4a3c;color:#fff}
.foot button{background:#ff7900;color:#fff}
.main{padding:22px 24px;min-width:0}
@media(max-width:900px){
  .shell{grid-template-columns:1fr}
  .topbar{display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:40;background:#0a3026;padding:8px 12px;min-height:56px}
  .burger,.top-pub{border:0;border-radius:8px;min-width:44px;min-height:44px;cursor:pointer;font-weight:800;font-size:18px}
  .burger{background:#1a4a3c;color:#fff}
  .top-brand{flex:1;display:flex;align-items:center;background:#fff;border-radius:8px;padding:4px 8px;min-width:0}
  .top-brand img{height:36px;width:auto;max-width:140px;object-fit:contain}
  .top-pub{background:#ff7900;color:#fff;font-size:13px;padding:0 12px;white-space:nowrap}
  .backdrop{display:block;position:fixed;inset:0;background:#0007;z-index:45}
  aside{position:fixed;top:56px;left:0;bottom:0;width:min(280px,86vw);z-index:50;transform:translateX(-110%);transition:transform .2s ease;box-shadow:none}
  .shell.menu-open aside{transform:translateX(0);box-shadow:12px 0 32px #0004}
  .main{padding:14px}
}
`]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  menuOpen = false;
  private navSub?: Subscription;

  constructor(public auth: AuthService, public publish: ProductPublishService, private router: Router) {}

  ngOnInit() {
    this.navSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.closeMenu());
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
    this.closeMenu();
  }

  toggleMenu() { this.menuOpen ? this.closeMenu() : this.openMenu(); }

  openMenu() {
    this.menuOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeMenu() {
    this.menuOpen = false;
    document.body.style.overflow = '';
  }

  get roleLabel() {
    const labels: Record<string, string> = {
      ADMIN: 'Administrateur',
      MANAGER: 'Gestionnaire',
      CATALOG_MANAGER: 'Responsable catalogue',
      ORDER_MANAGER: 'Responsable commandes',
      STOCK_MANAGER: 'Responsable stock'
    };
    return labels[this.auth.user()?.role || ''] || this.auth.user()?.role;
  }
}
