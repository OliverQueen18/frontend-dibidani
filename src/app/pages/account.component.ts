import {Component, OnInit, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ApiService} from '../core/api.service';
import {AuthService} from '../core/auth.service';
import {ProductPublishService} from '../core/product-publish.service';
import {ProductPublishDialogComponent} from '../shared/product-publish-dialog.component';

type Tab = 'dashboard' | 'orders' | 'products' | 'ordered' | 'addresses' | 'favorites' | 'reviews' | 'profile' | 'notifications';

type OrderFilter = 'all' | 'open' | 'delivered';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProductPublishDialogComponent],
  template: `
    <main class="container account">
      <aside>
        <div class="profile">
          👤
          <b>{{auth.user()?.fullName}}</b>
          <small>{{auth.user()?.email}}</small>
          <em *ngIf="seller">{{auth.user()?.shopName || 'Vendeur'}}</em>
        </div>
        <nav>
          <button type="button" [class.active]="tab==='dashboard'" (click)="setTab('dashboard')">⌂ Tableau de bord</button>
          <button type="button" *ngIf="seller" [class.active]="tab==='products'" (click)="setTab('products')">▣ Mes produits</button>
          <button type="button" *ngIf="seller" [class.active]="tab==='ordered'" (click)="setTab('ordered')">▤ Produits commandés</button>
          <button type="button" [class.active]="tab==='orders'" (click)="setTab('orders')">▣ Mes commandes</button>
          <button type="button" [class.active]="tab==='addresses'" (click)="setTab('addresses')">⌖ Mes adresses</button>
          <button type="button" [class.active]="tab==='favorites'" (click)="setTab('favorites')">♡ Mes favoris</button>
          <button type="button" [class.active]="tab==='reviews'" (click)="setTab('reviews')">☆ Mes avis</button>
          <button type="button" [class.active]="tab==='profile'" (click)="setTab('profile')">⚙ Mes informations</button>
          <button type="button" [class.active]="tab==='notifications'" (click)="setTab('notifications')">🔔 Notifications</button>
        </nav>
        <button type="button" class="logout" (click)="auth.logout()">Déconnexion</button>
      </aside>
      <section>
        <p class="err" *ngIf="err">{{err}}</p>
        <p class="ok" *ngIf="msg">{{msg}}</p>

        <ng-container *ngIf="tab==='dashboard'">
          <div class="account-head">
            <div>
              <h1>Tableau de bord</h1>
              <p class="lead" *ngIf="seller">Gérez votre boutique {{auth.user()?.shopName}} : publiez des produits et suivez ceux qui sont commandés.</p>
              <p class="lead" *ngIf="!seller">Retrouvez vos commandes, adresses et favoris.</p>
            </div>
            <button type="button" class="btn" *ngIf="seller" (click)="publish.openNew()">+ Publier un produit</button>
          </div>
          <div class="stats" *ngIf="seller && shopDash">
            <article><b>{{shopDash.productCount || 0}}</b><span>Produits</span></article>
            <article><b>{{shopDash.activeProductCount || 0}}</b><span>En vitrine</span></article>
            <article><b>{{shopDash.orderedLines || 0}}</b><span>Lignes commandées</span></article>
            <article><b>{{shopDash.openOrders || 0}}</b><span>Commandes ouvertes</span></article>
          </div>
          <div class="stats" *ngIf="!seller && dash">
            <article><b>{{dash.ordersCount || 0}}</b><span>Commandes</span></article>
            <article><b>{{(dash.totalSpent || 0).toLocaleString('fr-FR')}}</b><span>Dépensé (FCFA)</span></article>
            <article><b>{{dash.favoritesCount || 0}}</b><span>Favoris</span></article>
            <article><b>{{dash.addressesCount || 0}}</b><span>Adresses</span></article>
          </div>
          <div class="shortcuts">
            <button type="button" *ngIf="seller" (click)="setTab('products')">Mes produits</button>
            <button type="button" *ngIf="seller" (click)="setTab('ordered')">Produits commandés</button>
            <button type="button" (click)="setTab('orders')">Mes commandes</button>
            <button type="button" (click)="setTab('addresses')">Mes adresses</button>
            <button type="button" (click)="setTab('favorites')">Mes favoris</button>
            <button type="button" (click)="setTab('profile')">Mes informations</button>
          </div>
        </ng-container>

        <ng-container *ngIf="tab==='products'">
          <div class="account-head">
            <div>
              <h1>Mes produits</h1>
              <p class="lead">Publiez une fiche : elle apparaît sur le marché Dibidani sous votre boutique.</p>
            </div>
            <button type="button" class="btn" (click)="publish.openNew()">+ Publier un produit</button>
          </div>
          <div class="filters">
            <input [(ngModel)]="productQ" name="productQ" (keyup.enter)="loadProducts()" placeholder="Rechercher un produit ou un code-barres">
            <button type="button" (click)="loadProducts()">Filtrer</button>
          </div>
          <table *ngIf="products.length">
            <thead><tr><th>Produit</th><th>Prix</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let p of products">
                <td>
                  <div class="prod">
                    <img [src]="p.mainImageUrl || 'assets/product-placeholder.svg'" alt="">
                    <div>
                      <b>{{p.name}}</b>
                      <small>{{p.sku}}{{p.barcode ? ' · ' + p.barcode : ''}}</small>
                    </div>
                  </div>
                </td>
                <td>FCFA {{p.price | number:'1.0-0'}}</td>
                <td><span class="status" [class.off]="p.active===false">{{p.active===false ? 'Masqué' : 'En vitrine'}}</span></td>
                <td class="acts">
                  <button type="button" (click)="toggleProduct(p)" [disabled]="busyId===p.id">{{p.active===false ? 'Activer' : 'Masquer'}}</button>
                  <button type="button" (click)="publish.openEdit(p.id)">Modifier</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="empty" *ngIf="!busy && !products.length">Aucun produit pour le moment. Publiez votre première fiche.</p>
        </ng-container>

        <ng-container *ngIf="tab==='ordered'">
          <div class="account-head">
            <h1>Produits commandés</h1>
          </div>
          <p class="lead">Les articles de votre boutique présents dans les commandes clients.</p>
          <table *ngIf="ordered.length">
            <thead><tr><th>Produit</th><th>Commande</th><th>Client</th><th>Qté</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>
              <tr *ngFor="let l of ordered">
                <td>
                  <div class="prod">
                    <img [src]="l.imageUrl || 'assets/product-placeholder.svg'" alt="">
                    <div><b>{{l.productName}}</b><small>{{l.productSku}}</small></div>
                  </div>
                </td>
                <td>
                  {{l.orderNumber}}<br>
                  <small>{{l.createdAt | date:'dd/MM/yyyy'}}</small>
                </td>
                <td>{{l.customerName}}<br><small>{{l.customerPhone}} · {{l.district || 'Bamako'}}</small></td>
                <td>{{l.quantity}}</td>
                <td>{{(l.lineTotal || 0).toLocaleString('fr-FR')}} FCFA</td>
                <td><span class="status">{{l.statusLabel || l.status}}</span></td>
              </tr>
            </tbody>
          </table>
          <p class="empty" *ngIf="!busy && !ordered.length">Aucun de vos produits n’a encore été commandé.</p>
        </ng-container>

        <ng-container *ngIf="tab==='orders'">
          <div class="account-head">
            <h1>Mes commandes</h1>
            <div>
              <button type="button" [class.on]="orderFilter==='all'" (click)="orderFilter='all'">Toutes ({{orders.length}})</button>
              <button type="button" [class.on]="orderFilter==='open'" (click)="orderFilter='open'">En cours ({{openOrders.length}})</button>
              <button type="button" [class.on]="orderFilter==='delivered'" (click)="orderFilter='delivered'">Livrées ({{deliveredOrders.length}})</button>
            </div>
          </div>
          <table *ngIf="filteredOrders.length">
            <thead><tr><th>Commande</th><th>Date</th><th>Montant</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let o of filteredOrders">
                <td>{{o.orderNumber}}</td>
                <td>{{o.createdAt|date:'dd/MM/yyyy'}}</td>
                <td>{{(o.total || 0).toLocaleString('fr-FR')}} FCFA</td>
                <td><span class="status">{{o.statusLabel || o.status}}</span></td>
                <td><a [routerLink]="['/track', o.orderNumber]">Voir</a></td>
              </tr>
            </tbody>
          </table>
          <p class="empty" *ngIf="!filteredOrders.length">Aucune commande dans ce filtre.</p>
        </ng-container>

        <ng-container *ngIf="tab==='addresses'">
          <div class="account-head">
            <h1>Mes adresses</h1>
            <button type="button" class="btn" (click)="editAddress(null)">+ Nouvelle adresse</button>
          </div>
          <div class="cards">
            <article *ngFor="let a of addresses">
              <b>{{a.label || 'Adresse'}} <em *ngIf="a.defaultAddress">Par défaut</em></b>
              <p>{{a.fullName}} · {{a.phone}}</p>
              <p>{{a.addressLine}}</p>
              <p>{{a.zone?.name || a.zone?.district}}</p>
              <div class="acts">
                <button type="button" (click)="editAddress(a)">Modifier</button>
                <button type="button" *ngIf="!a.defaultAddress" (click)="makeDefault(a)">Par défaut</button>
                <button type="button" (click)="removeAddress(a)">Retirer</button>
              </div>
            </article>
          </div>
          <p class="empty" *ngIf="!addresses.length && !addressForm">Aucune adresse enregistrée.</p>
          <form class="card-form" *ngIf="addressForm" (submit)="$event.preventDefault(); saveAddress()">
            <h2>{{addressForm.id ? 'Modifier l’adresse' : 'Nouvelle adresse'}}</h2>
            <label>Libellé<input [(ngModel)]="addressForm.label" name="label" placeholder="Maison, Bureau…"></label>
            <label>Destinataire<input [(ngModel)]="addressForm.fullName" name="fullName" required></label>
            <label>Téléphone<input [(ngModel)]="addressForm.phone" name="phone" required></label>
            <label>Adresse<input [(ngModel)]="addressForm.addressLine" name="addressLine" required></label>
            <label>Quartier
              <select [(ngModel)]="addressForm.deliveryZoneId" name="deliveryZoneId" required>
                <option [ngValue]="null">Choisir</option>
                <option *ngFor="let z of zones" [ngValue]="z.id">{{z.name || z.district}}</option>
              </select>
            </label>
            <label>Repère<input [(ngModel)]="addressForm.landmark" name="landmark" placeholder="Près de…"></label>
            <label class="check"><input type="checkbox" [(ngModel)]="addressForm.defaultAddress" name="defaultAddress"> Adresse par défaut</label>
            <div class="acts">
              <button type="submit" [disabled]="busy">Enregistrer</button>
              <button type="button" (click)="addressForm=null">Annuler</button>
            </div>
          </form>
        </ng-container>

        <ng-container *ngIf="tab==='favorites'">
          <div class="account-head"><h1>Mes favoris</h1></div>
          <div class="favs" *ngIf="favorites.length">
            <article *ngFor="let p of favorites">
              <a [routerLink]="['/product', p.slug]"><img [src]="p.mainImageUrl || 'assets/product-placeholder.svg'" alt=""></a>
              <b>{{p.name}}</b>
              <small>{{(p.promoPrice || p.price).toLocaleString('fr-FR')}} FCFA</small>
              <button type="button" (click)="removeFav(p)">Retirer</button>
            </article>
          </div>
          <p class="empty" *ngIf="!favorites.length">Aucun favori pour le moment.</p>
        </ng-container>

        <ng-container *ngIf="tab==='reviews'">
          <div class="account-head"><h1>Mes avis</h1></div>
          <p class="empty">Vos avis sur les produits achetés apparaîtront ici.</p>
        </ng-container>

        <ng-container *ngIf="tab==='profile'">
          <div class="account-head"><h1>Mes informations</h1></div>
          <form class="card-form" (submit)="$event.preventDefault(); saveProfile()">
            <label>Nom complet<input [(ngModel)]="profile.fullName" name="fullName" required></label>
            <label>E-mail<input [value]="profile.email" disabled></label>
            <label>Téléphone<input [(ngModel)]="profile.phone" name="phone" required></label>
            <button type="submit" [disabled]="busy">Enregistrer</button>
          </form>
          <form class="card-form" (submit)="$event.preventDefault(); savePassword()">
            <h2>Mot de passe</h2>
            <label>Mot de passe actuel<input type="password" [(ngModel)]="passwords.currentPassword" name="currentPassword"></label>
            <label>Nouveau mot de passe<input type="password" [(ngModel)]="passwords.newPassword" name="newPassword"></label>
            <button type="submit" [disabled]="busy">Changer le mot de passe</button>
          </form>
        </ng-container>

        <ng-container *ngIf="tab==='notifications'">
          <div class="account-head"><h1>Notifications</h1></div>
          <p class="empty">Aucune notification pour le moment.</p>
        </ng-container>
      </section>
    </main>
    <app-product-publish-dialog></app-product-publish-dialog>
  `,
  styles: [`
    .account{display:grid;grid-template-columns:230px 1fr;gap:20px;padding-top:30px}
    .account aside,.account section{background:#fff;border:1px solid #e3ebe8;border-radius:13px}
    .account aside{padding:16px;display:flex;flex-direction:column;height:max-content}
    .profile{display:flex;flex-direction:column;align-items:center;padding:15px;border-bottom:1px solid #e9efed}
    .profile:first-child{font-size:28px}
    .profile b{font-size:13px}
    .profile small{font-size:10px}
    .profile em{font-style:normal;font-size:11px;color:#087a47;font-weight:800;margin-top:4px}
    .account aside nav{display:flex;flex-direction:column;margin-top:8px}
    .account aside button{padding:11px;border-radius:7px;font-size:13px;color:#4c5e57;text-align:left;background:0;border:0;cursor:pointer;font-family:inherit}
    .account aside button.active{background:#eaf7f0;color:#087a47;font-weight:800}
    .account aside .logout{color:#b42318;font-weight:800;margin-top:8px}
    .account section{padding:22px}
    .account-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
    .account-head h1{margin:0}
    .account-head button,.filters button,.btn,.acts button,.card-form button,.shortcuts button{border:1px solid #dfe7e4;background:#fff;padding:8px 10px;border-radius:7px;cursor:pointer;font-family:inherit}
    .account-head button.on,.btn,.card-form button[type=submit],.shortcuts button{background:#087a47;color:#fff;border-color:#087a47;font-weight:800}
    .lead{color:#4c5e57;font-size:13px;margin:6px 0 14px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}
    .stats article{background:#eaf7f0;border-radius:10px;padding:14px}
    .stats b{display:block;font-size:22px;color:#087a47}
    .stats span{font-size:12px;color:#4c5e57}
    .shortcuts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
    .filters{display:flex;gap:8px;margin:14px 0}
    .filters input,.card-form input,.card-form select{flex:1;border:1px solid #c5ddd2;border-radius:8px;padding:8px;font:inherit}
    table{width:100%;border-collapse:collapse;margin-top:15px}
    th,td{text-align:left;padding:12px;border-bottom:1px solid #edf1ef;font-size:12px}
    .status{background:#e8f8ef;color:#087a47;padding:5px 7px;border-radius:5px}
    .status.off{background:#f3f4f3;color:#6a7c75}
    td a{border:1px solid #1d7be8;color:#1d7be8;padding:5px 9px;border-radius:5px;text-decoration:none}
    .prod{display:flex;gap:10px;align-items:center}
    .prod img{width:44px;height:44px;object-fit:contain;background:#f6f9f7;border-radius:6px}
    .prod small,.empty{color:#6a7c75}
    .empty{padding:24px 0}
    .acts{display:flex;flex-wrap:wrap;gap:6px}
    .cards,.favs{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:14px}
    .cards article,.favs article,.card-form{border:1px solid #e3ebe8;border-radius:10px;padding:14px}
    .cards em{color:#087a47;font-style:normal;font-size:11px}
    .favs img{width:100%;height:120px;object-fit:contain;background:#f6f9f7;border-radius:8px}
    .card-form{display:flex;flex-direction:column;gap:10px;margin-top:16px;max-width:480px}
    .card-form h2{margin:0;font-size:16px}
    .card-form label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;color:#4c5e57}
    .check{flex-direction:row!important;align-items:center}
    .check input{width:auto}
    .err{color:#b42318}.ok{color:#087a47}
    @media(max-width:800px){
      .account{grid-template-columns:1fr}
      .account aside{position:sticky;top:64px;z-index:4}
      .account aside nav{flex-direction:row;flex-wrap:nowrap;overflow:auto}
      .account aside button{white-space:nowrap}
      .account section{overflow:auto}
      .stats{grid-template-columns:1fr 1fr}
    }
  `]
})
export class AccountComponent implements OnInit {
  tab: Tab = 'dashboard';
  orderFilter: OrderFilter = 'all';
  orders: any[] = [];
  products: any[] = [];
  ordered: any[] = [];
  addresses: any[] = [];
  favorites: any[] = [];
  zones: any[] = [];
  dash: any = null;
  shopDash: any = null;
  addressForm: any = null;
  profile: any = {fullName: '', email: '', phone: ''};
  passwords = {currentPassword: '', newPassword: ''};
  productQ = '';
  busy = false;
  busyId: number | null = null;
  err = '';
  msg = '';
  private seenSavedAt = 0;
  private ready = false;

  constructor(private api: ApiService, public auth: AuthService, public publish: ProductPublishService,
              private route: ActivatedRoute, private router: Router) {
    effect(() => {
      const t = this.publish.lastSavedAt();
      if (this.ready && t && t !== this.seenSavedAt) {
        this.seenSavedAt = t;
        this.msg = 'Produit enregistré.';
        if (this.tab === 'products' || this.tab === 'dashboard') this.loadProducts();
        if (this.seller) this.api.sellerDashboard().subscribe({next: d => this.shopDash = d});
      }
    });
  }

  get seller() { return this.auth.isSeller(); }
  get openOrders() { return this.orders.filter(o => this.isOpen(o.status)); }
  get deliveredOrders() { return this.orders.filter(o => o.status === 'DELIVERED'); }
  get filteredOrders() {
    if (this.orderFilter === 'open') return this.openOrders;
    if (this.orderFilter === 'delivered') return this.deliveredOrders;
    return this.orders;
  }

  ngOnInit() {
    this.ready = true;
    this.seenSavedAt = this.publish.lastSavedAt();
    this.profile = {
      fullName: this.auth.user()?.fullName || '',
      email: this.auth.user()?.email || '',
      phone: ''
    };
    if (this.seller && !this.auth.user()?.shopId) {
      this.auth.refresh().subscribe({error: () => {}});
    }
    this.route.queryParamMap.subscribe(q => {
      const next = this.normalizeTab(q.get('tab'));
      if (next !== this.tab) this.tab = next;
      this.loadTab();
    });
  }

  setTab(tab: Tab) {
    this.err = '';
    this.msg = '';
    this.router.navigate([], {relativeTo: this.route, queryParams: {tab}, queryParamsHandling: 'merge'});
  }

  loadProducts() {
    this.busy = true;
    this.api.sellerProducts(this.productQ).subscribe({
      next: p => { this.busy = false; this.products = p.content || p || []; },
      error: () => { this.busy = false; this.products = []; }
    });
  }

  toggleProduct(p: any) {
    if (!p?.id || this.busyId) return;
    const next = p.active === false;
    this.busyId = p.id;
    this.api.setSellerProductActive(p.id, next).subscribe({
      next: d => { this.busyId = null; p.active = d.active; this.msg = next ? 'Produit visible sur la vitrine.' : 'Produit masqué.'; },
      error: e => { this.busyId = null; this.err = e.error?.message || 'Impossible de changer le statut.'; }
    });
  }

  editAddress(a: any | null) {
    this.addressForm = a ? {
      id: a.id, label: a.label || '', fullName: a.fullName, phone: a.phone, addressLine: a.addressLine,
      deliveryZoneId: a.zone?.id || null, landmark: a.landmark || '', defaultAddress: !!a.defaultAddress
    } : {
      id: null, label: '', fullName: this.auth.user()?.fullName || '', phone: this.profile.phone || '',
      addressLine: '', deliveryZoneId: null, landmark: '', defaultAddress: this.addresses.length === 0
    };
    if (!this.zones.length) this.api.publicZones().subscribe({next: z => this.zones = z || []});
  }

  saveAddress() {
    if (!this.addressForm?.fullName || !this.addressForm.phone || !this.addressForm.addressLine || !this.addressForm.deliveryZoneId) {
      this.err = 'Complétez le destinataire, le téléphone, l’adresse et le quartier.';
      return;
    }
    this.busy = true; this.err = '';
    this.api.saveAddress(this.addressForm, this.addressForm.id || undefined).subscribe({
      next: () => { this.busy = false; this.addressForm = null; this.msg = 'Adresse enregistrée.'; this.loadAddresses(); },
      error: e => { this.busy = false; this.err = e.error?.message || 'Adresse impossible.'; }
    });
  }

  makeDefault(a: any) {
    this.api.setDefaultAddress(a.id).subscribe({next: () => this.loadAddresses(), error: e => this.err = e.error?.message || 'Impossible.'});
  }

  removeAddress(a: any) {
    this.api.deleteAddress(a.id).subscribe({next: () => this.loadAddresses(), error: e => this.err = e.error?.message || 'Impossible.'});
  }

  removeFav(p: any) {
    this.api.removeFavorite(p.id).subscribe({next: () => this.favorites = this.favorites.filter(x => x.id !== p.id)});
  }

  saveProfile() {
    this.busy = true; this.err = ''; this.msg = '';
    this.api.updateProfile({fullName: this.profile.fullName, phone: this.profile.phone}).subscribe({
      next: p => { this.busy = false; this.profile = p; this.msg = 'Informations enregistrées.'; },
      error: e => { this.busy = false; this.err = e.error?.message || 'Enregistrement impossible.'; }
    });
  }

  savePassword() {
    if (!this.passwords.currentPassword || !this.passwords.newPassword) {
      this.err = 'Indiquez le mot de passe actuel et le nouveau.';
      return;
    }
    this.busy = true; this.err = ''; this.msg = '';
    this.api.changePassword(this.passwords).subscribe({
      next: () => { this.busy = false; this.passwords = {currentPassword: '', newPassword: ''}; this.msg = 'Mot de passe mis à jour.'; },
      error: e => { this.busy = false; this.err = e.error?.message || 'Changement impossible.'; }
    });
  }

  private loadTab() {
    if (this.tab === 'dashboard') this.loadDashboard();
    if (this.tab === 'orders') this.loadOrders();
    if (this.tab === 'products') this.loadProducts();
    if (this.tab === 'ordered') this.loadOrdered();
    if (this.tab === 'addresses') this.loadAddresses();
    if (this.tab === 'favorites') this.loadFavorites();
    if (this.tab === 'profile') this.loadProfile();
  }

  private loadDashboard() {
    this.api.accountDashboard().subscribe({next: d => this.dash = d, error: () => this.dash = null});
    if (this.seller) this.api.sellerDashboard().subscribe({next: d => this.shopDash = d, error: () => this.shopDash = null});
  }

  private loadOrders() {
    this.api.orders().subscribe({next: o => this.orders = o || [], error: () => this.orders = []});
  }

  private loadOrdered() {
    this.busy = true;
    this.api.sellerOrders().subscribe({
      next: r => { this.busy = false; this.ordered = r || []; },
      error: () => { this.busy = false; this.ordered = []; }
    });
  }

  private loadAddresses() {
    this.api.addresses().subscribe({next: a => this.addresses = a || [], error: () => this.addresses = []});
    this.api.publicZones().subscribe({next: z => this.zones = z || [], error: () => this.zones = []});
  }

  private loadFavorites() {
    this.api.favorites().subscribe({next: f => this.favorites = f || [], error: () => this.favorites = []});
  }

  private loadProfile() {
    this.api.accountProfile().subscribe({
      next: p => this.profile = p,
      error: () => this.profile = {fullName: this.auth.user()?.fullName || '', email: this.auth.user()?.email || '', phone: ''}
    });
  }

  private normalizeTab(raw: string | null): Tab {
    const allowed: Tab[] = ['dashboard', 'orders', 'products', 'ordered', 'addresses', 'favorites', 'reviews', 'profile', 'notifications'];
    const tab = (raw || 'dashboard') as Tab;
    if (!allowed.includes(tab)) return 'dashboard';
    if ((tab === 'products' || tab === 'ordered') && !this.seller) return 'dashboard';
    return tab;
  }

  private isOpen(status?: string) {
    return !!status && !['DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].includes(status);
  }
}
