import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {Brand, Category, Product, Vendor} from '../core/models';
import {ProductCardComponent} from '../shared/product-card.component';
import {DEMO_CATEGORIES, demoProductsFor} from '../core/demo-data';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProductCardComponent],
  template: `
<main class="container page">
  <div class="breadcrumbs"><a routerLink="/">Accueil</a> › <a routerLink="/category/all">Catalogue</a> › {{title}}</div>
  <div class="category-ad" *ngIf="!q">
    <span>PUBLICITÉ</span>
    <b>Des offres spéciales au meilleur prix à Bamako</b>
    <a routerLink="/category/all" [queryParams]="{promo: 'true'}">Voir les offres</a>
  </div>
  <button class="filters-toggle" type="button" (click)="showFilters = !showFilters">{{showFilters ? 'Masquer les filtres' : 'Filtres et vendeurs'}}</button>
  <div class="catalog">
    <aside [class.open]="showFilters">
      <div class="aside-head">
        <h3>Filtres</h3>
        <button type="button" class="clear" *ngIf="hasFilters" (click)="reset()">Réinitialiser</button>
      </div>
      <label class="search-in">Dans cette catégorie
        <input [(ngModel)]="q" (keyup.enter)="apply()" placeholder="Nom, marque, vendeur…">
      </label>
      <h4>Prix (FCFA)</h4>
      <div class="price">
        <input type="number" [(ngModel)]="minPrice" min="0" placeholder="Min" (change)="apply()">
        <span>—</span>
        <input type="number" [(ngModel)]="maxPrice" min="0" placeholder="Max" (change)="apply()">
      </div>
      <label class="check"><input type="checkbox" [ngModel]="promo" (ngModelChange)="promo=$event; apply()"> Promotions uniquement</label>
      <h4 *ngIf="children.length">Sous-catégories</h4>
      <div class="chips" *ngIf="children.length">
        <a *ngFor="let c of children" [routerLink]="['/category', c.slug]">{{c.icon}} {{c.name}}</a>
      </div>
      <h4 *ngIf="brands.length">Marques</h4>
      <label class="check" *ngFor="let b of brands">
        <input type="checkbox" [checked]="brandIds.includes(b.id)" (change)="toggleBrand(b.id)">
        {{b.name}}
      </label>
      <h4>Vendeurs</h4>
      <p class="hint" *ngIf="!vendors.length">Aucun vendeur pour cette catégorie.</p>
      <button type="button" class="vendor" *ngFor="let v of vendors" [class.on]="vendorSlugs.includes(v.slug || '')" (click)="toggleVendor(v)">
        <img *ngIf="v.logoUrl" [src]="v.logoUrl" [alt]="v.name">
        <span class="avatar" *ngIf="!v.logoUrl">{{(v.name || '?').slice(0,1)}}</span>
        <span class="vendor-copy">
          <b>{{v.name}}</b>
          <small>{{v.district || v.city || 'Bamako'}}<ng-container *ngIf="v.productCount != null"> · {{v.productCount}} produit{{v.productCount > 1 ? 's' : ''}}</ng-container></small>
        </span>
      </button>
    </aside>
    <section class="results">
      <div class="results-head">
        <div>
          <h1>{{title}}</h1>
          <small>{{total}} produit{{total > 1 ? 's' : ''}}</small>
        </div>
        <select [(ngModel)]="sort" (ngModelChange)="apply()">
          <option value="">Plus récents</option>
          <option value="popular">Popularité</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="name">Nom A–Z</option>
        </select>
      </div>
      <div class="active-filters" *ngIf="hasFilters">
        <button type="button" *ngIf="q" (click)="q=''; apply()">Recherche : {{q}} ×</button>
        <button type="button" *ngIf="promo" (click)="promo=false; apply()">Promos ×</button>
        <button type="button" *ngIf="minPrice" (click)="minPrice=null; apply()">Min {{minPrice | number:'1.0-0'}} ×</button>
        <button type="button" *ngIf="maxPrice" (click)="maxPrice=null; apply()">Max {{maxPrice | number:'1.0-0'}} ×</button>
        <button type="button" *ngFor="let b of selectedBrands" (click)="toggleBrand(b.id)">{{b.name}} ×</button>
        <button type="button" *ngFor="let v of selectedVendors" (click)="toggleVendor(v)">{{v.name}} ×</button>
      </div>
      <div class="product-grid" *ngIf="products.length">
        <app-product-card *ngFor="let p of products" [p]="p"></app-product-card>
      </div>
      <p class="empty" *ngIf="!products.length">Aucun produit ne correspond à ces filtres. Élargissez la recherche ou réinitialisez.</p>
      <div class="bottom-ad">
        <span>PUBLICITÉ</span>
        <b>Accessoires et gadgets pour votre quotidien</b>
        <a routerLink="/category/all">Découvrir</a>
      </div>
    </section>
  </div>
</main>
`,
  styles: [`
.page{padding-top:20px;padding-bottom:48px}
.breadcrumbs{font-size:12px;color:#76847f;margin-bottom:15px}
.breadcrumbs a{color:#087a47;text-decoration:none}
.category-ad,.bottom-ad{background:linear-gradient(90deg,#ffd48a,#fff4d5);border-radius:10px;padding:18px 22px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.category-ad span,.bottom-ad span{font-size:10px;background:#087a47;color:#fff;padding:4px 7px;border-radius:4px}
.category-ad b,.bottom-ad b{flex:1;font-size:18px;min-width:180px}
.category-ad a,.bottom-ad a{background:#087a47;color:#fff;border-radius:7px;padding:10px 15px;text-decoration:none;font-weight:700}
.filters-toggle{display:none}
.catalog{display:grid;grid-template-columns:250px 1fr;gap:20px;margin-top:18px}
aside{background:#fff;border:1px solid #e4ece8;border-radius:12px;padding:18px;height:max-content}
.aside-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
aside h3{margin:0}
.clear{border:0;background:0;color:#087a47;font-size:12px;cursor:pointer;font-weight:700;padding:0}
aside h4{margin:18px 0 8px;font-size:13px;color:#173b30}
.search-in{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#4c5e57;margin:12px 0}
.search-in input,.price input{border:1px solid #d7e2de;border-radius:8px;padding:8px 10px;font:inherit;width:100%}
.price{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center}
.price span{color:#7d8b86}
.check{display:flex;align-items:center;gap:8px;font-size:13px;margin:8px 0;color:#43564f;cursor:pointer}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chips a{background:#eaf4ef;color:#0a3026;border-radius:8px;padding:6px 8px;font-size:12px;text-decoration:none}
.hint{font-size:12px;color:#7d8b86}
.vendor{width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:1px solid #e7edeb;background:#fff;border-radius:10px;padding:8px;margin:6px 0;cursor:pointer}
.vendor.on{border-color:#087a47;background:#e8f7ef}
.vendor img,.vendor .avatar{width:36px;height:36px;border-radius:8px;object-fit:contain;background:#f4f8f6;flex-shrink:0}
.vendor .avatar{display:grid;place-items:center;font-weight:800;color:#087a47}
.vendor-copy{display:flex;flex-direction:column;min-width:0}
.vendor-copy b{font-size:13px;color:#173b30}
.vendor-copy small{font-size:11px;color:#7d8b86}
.results-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:12px;flex-wrap:wrap}
.results-head h1{margin:0;color:#173b30}
.results-head small{color:#7d8b86}
.results-head select{padding:9px;border:1px solid #dce6e2;border-radius:8px;background:#fff}
.active-filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.active-filters button{border:0;background:#eaf4ef;color:#0a3026;border-radius:16px;padding:5px 10px;cursor:pointer;font-size:12px}
.product-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.empty{background:#fff;border:1px dashed #d7e2de;border-radius:12px;padding:28px;color:#6a7c75;text-align:center}
.bottom-ad{margin-top:20px}
@media(max-width:1100px){.product-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:900px){
  .catalog{grid-template-columns:1fr}
  .filters-toggle{display:block;width:100%;margin-top:12px;border:1px solid #d7e2de;background:#fff;border-radius:8px;padding:10px;font-weight:700;color:#173b30}
  aside{display:none}
  aside.open{display:block}
}
@media(max-width:600px){.product-grid{grid-template-columns:1fr 1fr}.category-ad b,.bottom-ad b{font-size:15px}}
`]
})
export class CategoryComponent implements OnInit {
  slug = 'all';
  title = 'Tous les produits';
  q = '';
  sort = '';
  promo = false;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  brandIds: number[] = [];
  vendorSlugs: string[] = [];
  products: Product[] = [];
  brands: Brand[] = [];
  vendors: Vendor[] = [];
  children: Category[] = [];
  total = 0;
  showFilters = false;
  private allVendors: Vendor[] = [];
  private facetProducts: Product[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {}

  get hasFilters() {
    return !!(this.q || this.promo || this.minPrice || this.maxPrice || this.brandIds.length || this.vendorSlugs.length);
  }
  get selectedBrands() { return this.brands.filter(b => this.brandIds.includes(b.id)); }
  get selectedVendors() { return this.vendors.filter(v => this.vendorSlugs.includes(v.slug || '')); }

  ngOnInit() {
    this.api.vendors().subscribe({
      next: rows => { this.allVendors = rows || []; this.setFacets(this.facetProducts); },
      error: () => { this.allVendors = []; this.setFacets(this.facetProducts); },
    });
    this.route.paramMap.subscribe(() => this.read());
    this.route.queryParamMap.subscribe(() => this.read());
  }

  read() {
    this.slug = this.route.snapshot.paramMap.get('slug') || 'all';
    const q = this.route.snapshot.queryParamMap;
    this.q = q.get('q') || '';
    this.sort = q.get('sort') || '';
    this.promo = q.get('promo') === 'true';
    this.minPrice = q.get('minPrice') ? Number(q.get('minPrice')) : null;
    this.maxPrice = q.get('maxPrice') ? Number(q.get('maxPrice')) : null;
    this.brandIds = (q.get('brand') || '').split(',').map(n => Number(n)).filter(n => n > 0);
    this.vendorSlugs = (q.get('vendor') || '').split(',').map(s => s.trim()).filter(Boolean);
    this.resolveCategory();
    this.loadFacets();
    this.load();
  }

  apply() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.q || null,
        sort: this.sort || null,
        promo: this.promo ? 'true' : null,
        minPrice: this.minPrice || null,
        maxPrice: this.maxPrice || null,
        brand: this.brandIds.join(',') || null,
        vendor: this.vendorSlugs.join(',') || null,
      },
      queryParamsHandling: '',
    });
  }

  reset() {
    this.q = ''; this.sort = ''; this.promo = false; this.minPrice = null; this.maxPrice = null;
    this.brandIds = []; this.vendorSlugs = [];
    this.apply();
  }

  toggleBrand(id: number) {
    this.brandIds = this.brandIds.includes(id) ? this.brandIds.filter(x => x !== id) : [...this.brandIds, id];
    this.apply();
  }

  toggleVendor(v: Vendor) {
    const slug = v.slug || '';
    if (!slug) return;
    this.vendorSlugs = this.vendorSlugs.includes(slug) ? this.vendorSlugs.filter(x => x !== slug) : [...this.vendorSlugs, slug];
    this.apply();
  }

  private resolveCategory() {
    this.api.categories().subscribe({
      next: rows => {
        const all = this.flatten(rows || []);
        const current = all.find(c => c.slug === this.slug);
        this.title = this.slug === 'all' ? (this.q ? 'Résultats de recherche' : 'Tous les produits') : (current?.name || this.slug.replaceAll('-', ' '));
        this.children = current?.children || [];
      },
      error: () => {
        const current = DEMO_CATEGORIES.find(c => c.slug === this.slug);
        this.title = this.slug === 'all' ? 'Tous les produits' : (current?.name || this.slug.replaceAll('-', ' '));
        this.children = [];
      }
    });
  }

  private loadFacets() {
    const params: Record<string, string | number | boolean> = {size: 60};
    if (this.slug && this.slug !== 'all') params['category'] = this.slug;
    this.api.products(params).subscribe({
      next: (r: any) => this.setFacets(r.content || []),
      error: () => this.setFacets(demoProductsFor(this.slug)),
    });
  }

  private setFacets(rows: Product[]) {
    this.facetProducts = rows || [];
    const brands = new Map<number, Brand>();
    const vendorKeys = new Set<string>();
    rows.forEach(p => {
      if (p.brand?.id) brands.set(p.brand.id, p.brand);
      const slug = p.vendor?.slug || (p.vendor as any)?.name;
      if (slug) vendorKeys.add(String(slug).toLowerCase());
    });
    this.brands = [...brands.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    const fromApi = this.allVendors.filter(v => vendorKeys.has((v.slug || '').toLowerCase()) || vendorKeys.has((v.name || '').toLowerCase()));
    const fromProducts = rows.map(p => p.vendor).filter((v): v is Vendor => !!v);
    const merged = new Map<string, Vendor>();
    [...fromApi, ...fromProducts].forEach(v => merged.set((v.slug || v.name).toLowerCase(), v));
    this.vendors = [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  private load() {
    const params: Record<string, string | number | boolean> = {size: 60};
    if (this.slug && this.slug !== 'all') params['category'] = this.slug;
    if (this.q) params['q'] = this.q;
    if (this.sort) params['sort'] = this.sort;
    if (this.promo) params['promo'] = true;
    if (this.minPrice) params['minPrice'] = this.minPrice;
    if (this.maxPrice) params['maxPrice'] = this.maxPrice;
    if (this.brandIds.length) params['brand'] = this.brandIds.join(',');
    if (this.vendorSlugs.length) params['vendor'] = this.vendorSlugs.join(',');
    this.api.products(params).subscribe({
      next: (r: any) => {
        this.products = r.content || [];
        this.total = r.totalElements ?? this.products.length;
        if (!this.products.length && !this.hasFilters) {
          this.products = demoProductsFor(this.slug);
          this.total = this.products.length;
        }
      },
      error: () => {
        this.products = this.filterDemo(demoProductsFor(this.slug));
        this.total = this.products.length;
      }
    });
  }

  private filterDemo(rows: Product[]) {
    return rows.filter(p => {
      if (this.q && !((p.name + ' ' + (p.brand?.name || '') + ' ' + (p.vendor?.name || '')).toLowerCase().includes(this.q.toLowerCase()))) return false;
      if (this.promo && !p.promoPrice) return false;
      const price = p.promoPrice ?? p.price;
      if (this.minPrice && price < this.minPrice) return false;
      if (this.maxPrice && price > this.maxPrice) return false;
      if (this.brandIds.length && !this.brandIds.includes(p.brand?.id || 0)) return false;
      if (this.vendorSlugs.length && !this.vendorSlugs.includes(p.vendor?.slug || '')) return false;
      return true;
    });
  }

  private flatten(rows: Category[]): Category[] {
    return rows.flatMap(c => [c, ...this.flatten(c.children || [])]);
  }
}
