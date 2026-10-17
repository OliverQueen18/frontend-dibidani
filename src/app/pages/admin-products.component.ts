import {Component, OnInit, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {AuthService} from '../core/auth.service';
import {ProductPublishService} from '../core/product-publish.service';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <header>
    <div><h1>Produits</h1><p>Catalogue publié sur la vitrine. La disponibilité se vérifie auprès des vendeurs à chaque commande — pas de stock d'entrepôt.</p></div>
    <button class="btn" *ngIf="auth.can('CATALOG_MANAGE')" type="button" (click)="publish.openNew()">+ Publier un produit</button>
  </header>
  <div class="filters">
    <input class="search" [(ngModel)]="q" (keyup.enter)="apply()" placeholder="Rechercher un nom, SKU, code-barres, marque, vendeur ou catégorie…">
    <select [(ngModel)]="category" (change)="apply()">
      <option value="">Toutes les catégories</option>
      <option *ngFor="let c of cats" [value]="c.slug">{{c.label}}</option>
    </select>
    <select [(ngModel)]="brand" (change)="apply()">
      <option value="">Toutes les marques</option>
      <option *ngFor="let b of brands" [value]="b.id">{{b.name}}</option>
    </select>
    <select [(ngModel)]="vendor" (change)="apply()">
      <option value="">Tous les vendeurs</option>
      <option *ngFor="let v of vendors" [value]="v.slug">{{v.name}}</option>
    </select>
    <select [(ngModel)]="status" (change)="apply()">
      <option value="">Tous les statuts</option>
      <option value="true">Actifs</option>
      <option value="false">Masqués</option>
    </select>
    <select [(ngModel)]="flag" (change)="apply()">
      <option value="">Toutes les mises en avant</option>
      <option value="promo">En promotion</option>
      <option value="featured">Mis en avant</option>
      <option value="new">Nouveautés</option>
    </select>
    <input class="price" type="number" min="0" [(ngModel)]="minPrice" (keyup.enter)="apply()" placeholder="Prix min">
    <input class="price" type="number" min="0" [(ngModel)]="maxPrice" (keyup.enter)="apply()" placeholder="Prix max">
    <select [(ngModel)]="sort" (change)="apply()">
      <option value="newest">Plus récents</option>
      <option value="name">Nom A → Z</option>
      <option value="price_asc">Prix croissant</option>
      <option value="price_desc">Prix décroissant</option>
      <option value="popular">Les plus demandés</option>
    </select>
    <select [(ngModel)]="size" (change)="apply()">
      <option [ngValue]="10">10 par page</option>
      <option [ngValue]="20">20 par page</option>
      <option [ngValue]="50">50 par page</option>
    </select>
    <button class="btn" type="button" (click)="apply()">Filtrer</button>
    <button class="btn ghost" type="button" (click)="reset()" *ngIf="dirty">Réinitialiser</button>
  </div>
  <p class="meta" *ngIf="total !== null">{{total}} produit{{total > 1 ? 's' : ''}}{{totalPages > 1 ? ' · page ' + (page + 1) + ' / ' + totalPages : ''}}</p>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <table>
    <tr><th>Vitrine</th><th>Produit</th><th>SKU</th><th>Code-barres</th><th>Prix</th><th>Vendeur</th><th>Catégorie</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let p of rows">
      <td>
        <img class="vitrine" [src]="p.mainImageUrl || 'assets/product-placeholder.svg'" [alt]="p.name">
      </td>
      <td>
        <b>{{p.name}}</b>
        <small *ngIf="p.brand?.name">{{p.brand.name}}</small>
      </td>
      <td>{{p.sku}}</td>
      <td>{{p.barcode || '—'}}</td>
      <td>
        <span *ngIf="p.onPromotion" class="promo">{{p.effectivePrice | number:'1.0-0'}} FCFA</span>
        <span [class.cut]="p.onPromotion">{{p.price | number:'1.0-0'}} FCFA</span>
      </td>
      <td>{{p.vendor?.name || '—'}}</td>
      <td>{{p.category?.name}}</td>
      <td><span class="tag" [class.off]="p.active===false">{{p.active===false ? 'Masqué' : 'Actif'}}</span></td>
      <td class="row-actions" *ngIf="auth.can('CATALOG_MANAGE')">
        <button type="button" (click)="toggle(p)" [disabled]="busyId===p.id">{{p.active===false ? 'Activer' : 'Désactiver'}}</button>
        <button type="button" (click)="publish.openEdit(p.id)">Modifier</button>
        <button type="button" (click)="duplicate(p)">Dupliquer</button>
        <button type="button" (click)="remove(p)">Retirer</button>
      </td>
    </tr>
    <tr *ngIf="!rows.length"><td colspan="9">Aucun produit ne correspond à ces filtres.</td></tr>
  </table>
  <nav class="pager" *ngIf="totalPages > 1">
    <button type="button" (click)="go(page - 1)" [disabled]="page===0">Précédent</button>
    <button type="button" *ngFor="let n of pages" [class.on]="n===page" (click)="go(n)">{{n + 1}}</button>
    <button type="button" (click)="go(page + 1)" [disabled]="page>=totalPages-1">Suivant</button>
  </nav>
</div>
`,
  styles: [ADMIN_PAGE_STYLES, `
.search{flex:1 1 320px;min-width:min(100%,280px)}
.filters select,.filters .price{min-width:150px}
.filters .price{width:110px}
.meta{color:#6a7c75;font-size:13px;margin:0 0 10px}
.vitrine{width:52px;height:52px;object-fit:contain;background:#f4f8f6;border:1px solid #e2e9e6;border-radius:8px;display:block}
td b{display:block}
td small{color:#6a7c75;font-size:11px}
.promo{display:block;color:#087a47;font-weight:800}
.cut{text-decoration:line-through;color:#8a9a94;font-size:11px}
.pager{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px;align-items:center}
.pager button{border:1px solid #d7e2de;background:#fff;color:#173b30;border-radius:8px;padding:7px 11px;cursor:pointer;font-weight:700}
.pager button.on{background:#087a47;color:#fff;border-color:#087a47}
.pager button:disabled{opacity:.4;cursor:default}
`]
})
export class AdminProductsComponent implements OnInit {
  rows: any[] = [];
  cats: any[] = [];
  brands: any[] = [];
  vendors: any[] = [];
  q = '';
  category = '';
  brand = '';
  vendor = '';
  status = '';
  flag = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sort = 'newest';
  page = 0;
  size = 10;
  total: number | null = null;
  totalPages = 0;
  busy = false;
  busyId: number | null = null;
  msg = '';
  err = '';
  private ready = false;
  private seenSavedAt = 0;
  private loadGen = 0;
  constructor(private api: ApiService, public auth: AuthService, public publish: ProductPublishService) {
    effect(() => {
      const t = this.publish.lastSavedAt();
      if (this.ready && t && t !== this.seenSavedAt) {
        this.seenSavedAt = t;
        this.msg = 'Produit enregistré.';
        this.load();
      }
    });
  }
  get dirty() {
    return !!(this.q || this.category || this.brand || this.vendor || this.status || this.flag || this.minPrice || this.maxPrice || this.sort !== 'newest');
  }
  get pages() {
    const max = 7;
    const start = Math.max(0, Math.min(this.page - 3, this.totalPages - max));
    return Array.from({length: Math.min(max, this.totalPages)}, (_, i) => start + i);
  }
  ngOnInit() {
    this.ready = true;
    this.seenSavedAt = this.publish.lastSavedAt();
    this.api.adminCategories().subscribe(r => this.cats = flatten(r));
    this.api.adminBrands().subscribe(r => this.brands = r);
    this.api.adminVendors().subscribe(v => this.vendors = Array.isArray(v) ? v : (v.content || []));
    this.load();
  }
  apply() { this.page = 0; this.load(); }
  reset() {
    this.q = ''; this.category = ''; this.brand = ''; this.vendor = ''; this.status = '';
    this.flag = ''; this.minPrice = null; this.maxPrice = null; this.sort = 'newest';
    this.apply();
  }
  go(n: number) {
    if (n < 0 || n >= this.totalPages || n === this.page) return;
    this.page = n;
    this.load();
  }
  load() {
    const gen = ++this.loadGen;
    this.api.adminProducts(this.filters(), this.page, this.size).subscribe(p => {
      if (gen !== this.loadGen) return;
      this.rows = p.content || [];
      this.total = p.totalElements ?? this.rows.length;
      this.totalPages = p.totalPages ?? 1;
      this.page = p.page ?? this.page;
    });
  }
  private filters() {
    return {
      q: this.q.trim() || undefined,
      category: this.category || undefined,
      brand: this.brand || undefined,
      vendor: this.vendor || undefined,
      active: this.status === '' ? undefined : this.status === 'true',
      promo: this.flag === 'promo' || undefined,
      featured: this.flag === 'featured' || undefined,
      newArrival: this.flag === 'new' || undefined,
      minPrice: this.minPrice || undefined,
      maxPrice: this.maxPrice || undefined,
      sort: this.sort || undefined
    };
  }
  toggle(p: any) {
    if (!p?.id || this.busyId) return;
    const next = p.active === false;
    this.busyId = p.id;
    this.msg = '';
    this.err = '';
    this.api.setProductActive(p.id, next).subscribe({
      next: d => {
        this.busyId = null;
        p.active = d.active;
        this.msg = next ? 'Produit visible sur la vitrine.' : 'Produit masqué de la vitrine.';
      },
      error: e => { this.busyId = null; this.err = e.error?.message || 'Impossible de changer le statut.'; }
    });
  }
  duplicate(p: any) {
    if (!p?.id) return;
    this.busy = true; this.msg = ''; this.err = '';
    this.api.duplicateProduct(p.id).subscribe({
      next: d => {
        this.busy = false;
        this.load();
        this.publish.openEdit(d.id, d);
        this.msg = 'Copie créée (masquée). Vérifiez la fiche, puis publiez.';
      },
      error: e => { this.busy = false; this.err = e.error?.message || 'Duplication impossible.'; }
    });
  }
  remove(p: any) {
    if (!confirm('Retirer « ' + p.name + ' » de la vitrine ?')) return;
    this.api.deleteProduct(p.id).subscribe({next: () => { this.msg = 'Produit retiré.'; this.load(); }, error: e => this.err = e.error?.message || 'Impossible.'});
  }
}

function flatten(rows: any[], out: any[] = [], prefix = ''): any[] {
  for (const c of rows || []) {
    out.push({ ...c, label: prefix + c.name });
    if (c.children?.length) flatten(c.children, out, prefix + '— ');
  }
  return out;
}
