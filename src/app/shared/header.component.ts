import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CartService } from '../core/cart.service';
import { AuthService } from '../core/auth.service';
import { SettingsService } from '../core/settings.service';
import { SocialIconsComponent } from './social-icons.component';
import { SiteBlock } from '../core/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, SocialIconsComponent],
  template: `
<div class="topbar">
  <div class="container topbar-inner">
    <span>📍 {{s.settings().topbarText || 'Livraison rapide à Bamako'}}</span>
    <div class="top-help">Besoin d'aide ? &nbsp; <b>{{s.settings().phone || '+223 76 12 34 56'}}</b>
      <app-social-icons [compact]="true" [items]="s.socials()"></app-social-icons>
    </div>
  </div>
</div>
<header class="main-header">
  <div class="container header-row">
    <a routerLink="/" class="brand"><img [src]="s.logo()" alt="Dibidani"></a>
    <form class="search" (submit)="$event.preventDefault(); search()">
      <input [(ngModel)]="q" name="q" placeholder="Rechercher un produit, une marque, une catégorie..." aria-label="Rechercher">
      <button type="submit" aria-label="Lancer la recherche">⌕</button>
    </form>
    <div class="header-actions">
      <a routerLink="/admin" class="staff" *ngIf="auth.isStaff()" aria-label="Back-office">▦<span>Back-office</span></a>
      <a routerLink="/account" class="fav" [queryParams]="{tab:'favorites'}" aria-label="Favoris">♡<span>Favoris</span></a>
      <a class="account" [routerLink]="auth.token() ? auth.homePath() : '/login'" [attr.aria-label]="auth.user()?.fullName || 'Compte'">👤<span>{{auth.user()?.fullName || 'Compte'}}</span></a>
      <button type="button" class="out" *ngIf="auth.token()" (click)="auth.logout()" aria-label="Déconnexion">⏻<span>Déconnexion</span></button>
      <a routerLink="/cart" class="cart" aria-label="Panier">🛒<span>Panier</span><b>{{cart.count()}}</b></a>
    </div>
  </div>
  <nav class="nav">
    <div class="container nav-inner">
      <ng-container *ngIf="headerMenu.length; else cats">
        <a *ngFor="let m of headerMenu" [class.promo]="m.meta==='promo'" [routerLink]="s.isExternal(m.linkUrl) ? null : m.linkUrl" [href]="s.isExternal(m.linkUrl) ? m.linkUrl : null" [attr.target]="s.isExternal(m.linkUrl) ? '_blank' : null" [attr.rel]="s.isExternal(m.linkUrl) ? 'noopener' : null">{{m.title}}</a>
      </ng-container>
      <ng-template #cats>
        <a routerLink="/category/all">☰ Toutes les catégories</a>
        <a *ngFor="let c of s.categories()" [routerLink]="['/category', c.slug]">{{c.name}}</a>
        <a class="promo" routerLink="/category/all">{{s.settings().navPromoLabel || 'Promotions'}}</a>
      </ng-template>
    </div>
  </nav>
</header>
`,
  styles: [`
:host{display:block}
.topbar{background:#087a47;color:#fff;font-size:12px}
.topbar-inner{display:flex;justify-content:space-between;padding:6px 0}
.main-header{background:#fff;position:sticky;top:0;z-index:50;box-shadow:0 3px 18px #0000000a}
.header-row{height:82px;display:flex;align-items:center;gap:28px}
.brand img{width:188px;height:64px;object-fit:contain}
.search{display:flex;flex:1;border:1px solid #dfe8e4;border-radius:9px;overflow:hidden;background:#fff}
.search input{border:0;outline:0;flex:1;padding:14px 16px}
.search button{background:#087a47;color:white;border:0;width:52px;font-size:20px}
.header-actions{display:flex;gap:20px;flex-shrink:0}
.header-actions a,.header-actions button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:44px;min-height:44px;font-size:18px;text-decoration:none;color:#173c31;background:0;border:0;cursor:pointer;font-family:inherit}
.header-actions span{font-size:11px;margin-top:3px}
.cart b{position:absolute;top:-2px;right:0;background:#ff7900;color:#fff;border-radius:20px;font-size:10px;padding:2px 5px}
.nav{background:#076d40}
.nav-inner{display:flex;align-items:center;gap:20px;height:42px;overflow:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.nav-inner::-webkit-scrollbar{display:none}
.nav a{color:#fff;text-decoration:none;white-space:nowrap;font-size:13px}
.nav a:first-child{font-weight:700}
.nav .promo{margin-left:auto;color:#ffe0c2}
.top-help{display:flex;align-items:center;gap:10px}
.topbar app-social-icons{margin-left:4px}
@media(max-width:900px){
  .topbar{display:none}
  .header-row{height:auto;min-height:56px;gap:10px;padding:8px 0;display:grid;grid-template-columns:auto 1fr auto;align-items:center}
  .brand{grid-column:1}
  .search{grid-column:2;min-width:0}
  .header-actions{grid-column:3;gap:4px}
  .brand img{width:110px;height:44px}
  .header-actions .staff,.header-actions .out{display:none}
  .header-actions span{display:none}
  .search input{min-width:0;padding:10px 12px}
  .search button{width:44px}
  .nav-inner{gap:14px;height:40px}
}
@media(max-width:640px){
  .header-row{grid-template-columns:1fr auto}
  .brand{grid-column:1;grid-row:1}
  .header-actions{grid-column:2;grid-row:1}
  .search{grid-column:1/-1;grid-row:2}
  .brand img{width:96px;height:40px}
}
`]
})
export class HeaderComponent {
  q = '';
  constructor(public cart: CartService, public auth: AuthService, public s: SettingsService) {}
  get headerMenu(): SiteBlock[] { return this.s.menu('header'); }
  search() { location.href = '/category/all?q=' + encodeURIComponent(this.q); }
}
