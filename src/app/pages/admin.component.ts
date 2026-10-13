import {Component, OnInit, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {ApiService} from '../core/api.service';
import {AuthService} from '../core/auth.service';
import {ProductPublishService} from '../core/product-publish.service';
import {Product, SocialChannel} from '../core/models';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">
  <header>
    <div><h1>Tableau de bord</h1><p>Pilotage de la boutique Dibidani</p></div>
    <div class="head-actions">
      <button class="btn" type="button" *ngIf="auth.can('CATALOG_MANAGE')" (click)="productPublish.openNew()">+ Publier un produit</button>
      <a class="btn ghost" routerLink="/" target="_blank" rel="noopener">Voir le site</a>
    </div>
  </header>
  <div class="kpis">
    <div><small>Chiffre d'affaires</small><b>{{money(kpis.revenue)}}</b></div>
    <div><small>Commandes</small><b>{{kpis.orders || 0}}</b></div>
    <div><small>Clients</small><b>{{kpis.totalCustomers || dash.clients || 0}}</b></div>
    <div><small>Produits</small><b>{{kpis.activeProducts || dash.products || 0}}</b></div>
  </div>
  <div class="grid">
    <div class="panel">
      <h2>Ventes</h2>
      <div class="chart"><i *ngFor="let h of bars" [style.height.%]="h"></i></div>
    </div>
    <div class="panel">
      <h2>Commandes récentes</h2>
      <div class="order" *ngFor="let o of recent">
        <span>{{o.orderNumber}}</span>
        <b>{{money(o.total)}}</b>
        <em>{{o.statusLabel || o.status}}</em>
      </div>
    </div>
  </div>
  <div class="panel products" *ngIf="auth.can('CATALOG_VIEW')">
    <div class="panel-head">
      <h2>Produits</h2>
      <div class="head-actions">
        <button class="btn" type="button" *ngIf="auth.can('CATALOG_MANAGE')" (click)="productPublish.openNew()">Publier</button>
        <a class="btn ghost" routerLink="/admin/produits">Gérer</a>
      </div>
    </div>
    <p class="msg" *ngIf="pubMsg">{{pubMsg}}</p>
    <table>
      <tr><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Vendeur</th><th>Réseaux</th></tr>
      <tr *ngFor="let p of products.slice(0,8)">
        <td>{{p.name}}</td>
        <td>{{p.category?.name}}</td>
        <td>FCFA {{p.price | number:'1.0-0'}}</td>
        <td>{{p.vendor?.name}}</td>
        <td class="soc">
          <button type="button" (click)="publish(p,'WHATSAPP')">WA</button>
          <button type="button" (click)="publish(p,'FACEBOOK')">FB</button>
          <button type="button" (click)="publish(p,'TIKTOK')">TT</button>
        </td>
      </tr>
    </table>
  </div>
</div>
`,
  styles: [ADMIN_PAGE_STYLES, `
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.panel{padding:16px}.panel h2{margin:0 0 10px;font-size:16px}
.chart{height:170px;display:flex;align-items:end;gap:6px}
.chart i{flex:1;background:linear-gradient(#10a663,#087a47);border-radius:5px 5px 0 0}
.order{display:grid;grid-template-columns:1fr auto;gap:2px;padding:8px 0;border-bottom:1px solid #edf1ef}
.order em{grid-column:1/3;color:#087a47;font-size:11px}
.panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.head-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.soc button{margin-right:3px;border:0;background:#087a47;color:#fff;border-radius:5px;padding:4px 6px;font-size:10px;font-weight:800;cursor:pointer}
.products{padding:16px}
@media(max-width:900px){.grid{grid-template-columns:1fr}}
`]
})
export class AdminComponent implements OnInit {
  dash: any = {};
  products: Product[] = [];
  recent: any[] = [];
  bars = [38, 55, 42, 67, 58, 75, 65, 82, 74, 92, 85, 100];
  pubMsg = '';
  constructor(private api: ApiService, public auth: AuthService, public productPublish: ProductPublishService) {
    effect(() => {
      const t = this.productPublish.lastSavedAt();
      if (t && this.auth.can('CATALOG_VIEW')) this.api.adminProducts().subscribe(p => this.products = p.content || p);
    });
  }
  get kpis() { return this.dash.kpis || this.dash || {}; }
  money(v: any) { return Number(v || 0).toLocaleString('fr-FR') + ' FCFA'; }
  ngOnInit() {
    this.api.dashboard().subscribe(d => {
      this.dash = d;
      this.recent = d.latestOrders || [];
      const days = d.salesByDay || [];
      if (days.length) {
        const max = Math.max(...days.map((x: any) => Number(x.revenue || 0)), 1);
        this.bars = days.map((x: any) => Math.max(8, Math.round(Number(x.revenue || 0) / max * 100)));
      }
    });
    if (this.auth.can('CATALOG_VIEW')) this.api.adminProducts().subscribe(p => this.products = p.content || p);
    if (this.auth.can('ORDERS_MANAGE') && !this.recent.length) this.api.adminOrders({size: 5}).subscribe(o => this.recent = o.content || o);
  }
  publish(p: Product, channel: SocialChannel) {
    this.pubMsg = 'Publication de ' + p.name + '…';
    this.api.publishProduct(p.id, [channel]).subscribe({
      next: rows => {
        const r = rows[0];
        this.pubMsg = r?.status === 'FAILED' ? (r.errorMessage || 'Échec') : p.name + ' → ' + r?.channelLabel;
        if (r?.shareUrl) window.open(r.shareUrl, '_blank', 'noopener');
      },
      error: e => this.pubMsg = e.error?.message || 'Publication impossible.'
    });
  }
}
