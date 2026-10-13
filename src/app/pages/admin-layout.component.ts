import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ProductPublishService } from '../core/product-publish.service';
import { ProductPublishDialogComponent } from '../shared/product-publish-dialog.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ProductPublishDialogComponent],
  template: `
<main class="shell">
  <aside>
    <div class="brand"><img src="assets/logo-dibidani.png" alt="Dibidani"></div>
    <p class="who"><b>{{auth.user()?.fullName}}</b><small>{{roleLabel}}</small></p>
    <button class="publish" type="button" *ngIf="auth.can('CATALOG_MANAGE')" (click)="publish.openNew()">+ Publier un produit</button>
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
    <div class="mobile-bar" *ngIf="auth.can('CATALOG_MANAGE')">
      <button type="button" (click)="publish.openNew()">+ Publier un produit</button>
    </div>
    <router-outlet></router-outlet>
  </section>
</main>
<app-product-publish-dialog></app-product-publish-dialog>
`,
  styles: [`
.shell{display:grid;grid-template-columns:232px 1fr;min-height:100vh;background:#f4f7f6}
aside{background:#0a3026;color:#fff;padding:16px;display:flex;flex-direction:column;gap:8px}
.brand{background:#fff;border-radius:9px;padding:6px}
.brand img{width:100%;height:56px;object-fit:contain}
.who{margin:4px 0 8px;display:flex;flex-direction:column}
.who b{font-size:13px}.who small{color:#9cb8ae;font-size:11px}
.publish{border:0;background:#ff7900;color:#fff;border-radius:8px;padding:10px 12px;font-weight:800;cursor:pointer;font-size:13px}
.mobile-bar{display:none}
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
  .shell{grid-template-columns:1fr}aside{display:none}.main{padding:14px}
  .mobile-bar{display:block;margin-bottom:12px}
  .mobile-bar button{width:100%;border:0;background:#ff7900;color:#fff;border-radius:8px;padding:12px;font-weight:800;cursor:pointer}
}
`]
})
export class AdminLayoutComponent {
  constructor(public auth: AuthService, public publish: ProductPublishService) {}
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
