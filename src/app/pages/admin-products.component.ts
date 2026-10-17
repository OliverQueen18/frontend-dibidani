import {Component, HostListener, OnInit, effect} from '@angular/core';
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
    <tr *ngFor="let p of rows" class="clickable" [class.on]="detail?.id===p.id" (click)="open(p)" (keydown.enter)="open(p)" tabindex="0">
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
      <td class="row-actions" *ngIf="auth.can('CATALOG_MANAGE')" (click)="$event.stopPropagation()">
        <button type="button" (click)="toggle(p)" [disabled]="busyId===p.id">{{p.active===false ? 'Activer' : 'Désactiver'}}</button>
        <button type="button" (click)="publish.openEdit(p.id)">Modifier</button>
        <button type="button" (click)="duplicate(p)">Dupliquer</button>
        <button type="button" (click)="remove(p)">Retirer</button>
      </td>
    </tr>
    <tr *ngIf="!rows.length"><td colspan="9">Aucun produit ne correspond à ces filtres.</td></tr>
  </table>
  <div class="scrim" *ngIf="detail" (click)="close()" role="presentation">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="prod-title" (click)="$event.stopPropagation()">
      <header>
        <div>
          <p class="kicker">Fiche produit</p>
          <h2 id="prod-title">{{detail.name}}</h2>
          <p>{{detail.brand?.name || 'Sans marque'}} · {{detail.sku}}</p>
        </div>
        <button type="button" class="x" (click)="close()" aria-label="Fermer">×</button>
      </header>
      <p class="err" *ngIf="detailErr">{{detailErr}}</p>
      <p class="muted" *ngIf="detailLoading">Chargement de la fiche…</p>
      <div class="body" *ngIf="!detailLoading">
        <div class="gallery">
          <img class="hero" [src]="detailShot || 'assets/product-placeholder.svg'" [alt]="detail.name">
          <div class="thumbs" *ngIf="detailShots.length > 1">
            <button type="button" *ngFor="let u of detailShots" [class.on]="u===detailShot" (click)="detailShot=u">
              <img [src]="u" [alt]="detail.name">
            </button>
          </div>
        </div>
        <dl class="facts">
          <div><dt>Statut</dt><dd><span class="tag" [class.off]="detail.active===false">{{detail.active===false ? 'Masqué' : 'Actif'}}</span></dd></div>
          <div><dt>Prix</dt>
            <dd>
              <b *ngIf="detail.onPromotion">{{detail.effectivePrice | number:'1.0-0'}} FCFA</b>
              <span [class.cut]="detail.onPromotion">{{detail.price | number:'1.0-0'}} FCFA</span>
              <small *ngIf="detail.onPromotion">Promo −{{detail.discountPercent}}%</small>
            </dd>
          </div>
          <div *ngIf="auth.can('CATALOG_MANAGE') && detail.costPrice != null"><dt>Coût d'achat</dt><dd>{{detail.costPrice | number:'1.0-0'}} FCFA</dd></div>
          <div><dt>Code-barres</dt><dd>{{detail.barcode || '—'}}</dd></div>
          <div><dt>Vendeur</dt><dd>{{detail.vendor?.name || '—'}}</dd></div>
          <div><dt>Catégorie</dt><dd>{{detail.category?.name}}<ng-container *ngIf="detail.subcategory"> · {{detail.subcategory.name}}</ng-container></dd></div>
          <div><dt>Unité</dt><dd>{{detail.unit || 'unité'}}</dd></div>
          <div><dt>Mise en avant</dt>
            <dd>{{flags(detail) || 'Aucune'}}</dd>
          </div>
          <div *ngIf="detail.oemReference"><dt>Réf. OEM</dt><dd>{{detail.oemReference}}</dd></div>
          <div *ngIf="detail.manufacturerReference"><dt>Réf. fabricant</dt><dd>{{detail.manufacturerReference}}</dd></div>
          <div *ngIf="dims(detail)"><dt>Dimensions</dt><dd>{{dims(detail)}}</dd></div>
        </dl>
        <p class="lead" *ngIf="detail.shortDescription">{{detail.shortDescription}}</p>
        <p class="desc" *ngIf="detail.description">{{detail.description}}</p>
        <div class="block" *ngIf="detail.specifications?.length">
          <h3>Caractéristiques</h3>
          <dl class="specs">
            <div *ngFor="let s of detail.specifications"><dt>{{s.label}}</dt><dd>{{s.value}}</dd></div>
          </dl>
        </div>
        <div class="block" *ngIf="detail.variants?.length">
          <h3>Variantes</h3>
          <ul>
            <li *ngFor="let v of detail.variants">{{v.name}} · {{v.sku}} · {{v.price | number:'1.0-0'}} FCFA</li>
          </ul>
        </div>
        <div class="block" *ngIf="detail.compatibilities?.length">
          <h3>Compatibilités</h3>
          <ul>
            <li *ngFor="let c of detail.compatibilities">{{c.label || c.modelName || c.engineName || 'Véhicule'}}</li>
          </ul>
        </div>
      </div>
      <footer>
        <button class="btn" type="button" *ngIf="auth.can('CATALOG_MANAGE')" (click)="edit(detail)">Modifier</button>
        <button class="btn ghost" type="button" (click)="close()">Fermer</button>
      </footer>
    </section>
  </div>
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
tr.clickable{cursor:pointer}
tr.clickable:hover,tr.clickable.on{background:#eaf7f0}
tr.clickable:focus-visible{outline:2px solid #087a47;outline-offset:-2px}
.scrim{position:fixed;inset:0;z-index:70;background:rgba(6,30,24,.55);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
.sheet{width:min(820px,100%);max-height:min(92vh,860px);background:#fff;border-radius:16px;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(6,30,24,.28);overflow:hidden}
.sheet header{display:flex;justify-content:space-between;gap:12px;padding:16px 18px 8px;align-items:flex-start}
.sheet .kicker{margin:0;color:#087a47;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.sheet h2{margin:4px 0 0;font-size:20px;color:#173b30}
.sheet header p{margin:4px 0 0;color:#6a7c75;font-size:13px}
.x{border:0;background:#eaf4ef;width:36px;height:36px;border-radius:50%;font-size:22px;cursor:pointer;line-height:1;color:#173b30}
.sheet .body{padding:8px 18px 16px;overflow:auto;display:grid;gap:14px}
.gallery{display:grid;gap:8px;justify-items:center}
.hero{width:min(100%,280px);height:200px;object-fit:contain;background:#f4f8f6;border:1px solid #e2e9e6;border-radius:12px}
.thumbs{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.thumbs button{border:2px solid #e2e9e6;background:#fff;border-radius:8px;padding:2px;cursor:pointer}
.thumbs button.on{border-color:#087a47}
.thumbs img{width:48px;height:48px;object-fit:contain;display:block}
.facts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px 16px;margin:0}
.facts dt{font-size:11px;text-transform:uppercase;color:#6a7c75}
.facts dd{margin:2px 0 0;font-size:14px}
.facts dd b{display:block;color:#087a47}
.facts dd small{display:block;color:#087a47;font-size:11px;font-weight:700}
.lead{margin:0;font-weight:700;color:#173b30}
.desc{margin:0;color:#3d524b;white-space:pre-wrap}
.block h3{margin:0 0 6px;font-size:14px}
.specs{display:grid;gap:6px;margin:0}
.specs div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #edf1ef;padding:4px 0}
.specs dt{color:#6a7c75}
.specs dd{margin:0;font-weight:700}
.block ul{margin:0;padding-left:18px}
.sheet footer{display:flex;gap:8px;padding:12px 18px 16px;border-top:1px solid #edf1ef}
.muted{color:#6a7c75;font-size:13px;margin:0 18px}
@media(max-width:700px){
  .scrim{padding:0;align-items:stretch}
  .sheet{width:100%;max-height:100%;border-radius:0}
  .facts{grid-template-columns:1fr}
}
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
  detail: any = null;
  detailShot = '';
  detailShots: string[] = [];
  detailLoading = false;
  detailErr = '';
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
  @HostListener('document:keydown.escape')
  onEscape() { if (this.detail) this.close(); }
  open(p: any) {
    if (!p?.id) return;
    this.detail = p;
    this.detailShots = galleryOf(p);
    this.detailShot = this.detailShots[0] || '';
    this.detailLoading = true;
    this.detailErr = '';
    this.api.adminProduct(p.id).subscribe({
      next: d => {
        this.detail = d;
        this.detailShots = galleryOf(d);
        this.detailShot = this.detailShots[0] || '';
        this.detailLoading = false;
      },
      error: e => { this.detailLoading = false; this.detailErr = e.error?.message || 'Impossible de charger la fiche.'; }
    });
  }
  close() { this.detail = null; this.detailErr = ''; this.detailLoading = false; }
  edit(p: any) {
    this.close();
    this.publish.openEdit(p.id, p);
  }
  flags(p: any) {
    return [p.featured && 'Mis en avant', p.newArrival && 'Nouveauté', p.bestSeller && 'Meilleure vente', p.onPromotion && 'Promotion']
      .filter(Boolean).join(' · ');
  }
  dims(p: any) {
    const parts = [
      p.lengthCm && (p.lengthCm + ' ×'),
      p.widthCm && (p.widthCm + ' ×'),
      p.heightCm && (p.heightCm + ' cm'),
      p.weightKg && (p.weightKg + ' kg')
    ].filter(Boolean);
    return parts.join(' ').replace(/×$/, '').trim();
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

function galleryOf(d: any): string[] {
  const out: string[] = [];
  const add = (u?: string) => { if (u && !out.includes(u)) out.push(u); };
  add(d?.mainImageUrl);
  (d?.images || []).forEach(add);
  return out;
}
