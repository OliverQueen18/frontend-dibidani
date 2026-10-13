import {Component,OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {ApiService} from '../core/api.service';
import {CartService} from '../core/cart.service';
import {AuthService} from '../core/auth.service';
import {SettingsService} from '../core/settings.service';
import {Product,ProductShare,SocialChannel,productGallery} from '../core/models';
import {SocialShareComponent} from '../shared/social-share.component';
import {demoProduct} from '../core/demo-data';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, SocialShareComponent],
  template: `
    <main class="container page" *ngIf="p">
      <div class="breadcrumbs"><a routerLink="/">Accueil</a> › {{p.category.name}} › {{p.name}}</div>
      <div class="detail">
        <div class="gallery" [class.single]="gallery.length<2">
          <div class="thumbs" *ngIf="gallery.length>1">
            <button type="button" *ngFor="let img of gallery; let i = index" [class.on]="i===photo" (click)="photo=i" [attr.aria-label]="'Photo '+(i+1)">
              <img [src]="img" [alt]="p.name">
            </button>
          </div>
          <div class="main-img">
            <img [src]="gallery[photo] || 'assets/product-placeholder.svg'" [alt]="p.name">
            <button class="nav prev" type="button" *ngIf="gallery.length>1" (click)="prevPhoto()" aria-label="Photo précédente">‹</button>
            <button class="nav next" type="button" *ngIf="gallery.length>1" (click)="nextPhoto()" aria-label="Photo suivante">›</button>
          </div>
        </div>
        <div class="info">
          <h1>{{p.name}}</h1>
          <div class="stars">★★★★★ <span>({{p.reviewCount}} avis)</span></div>
          <div class="price">FCFA {{(p.promoPrice??p.price).toLocaleString('fr-FR')}} <del *ngIf="p.promoPrice">{{p.price.toLocaleString('fr-FR')}}</del></div>
          <div class="seller">🏪 Vendu par : <b>{{p.vendor?.name}}</b></div>
          <div class="stock">● Disponibilité à confirmer auprès du vendeur</div>
          <ul>
            <li>Référence : {{p.sku}}</li>
            <li *ngIf="p.barcode">Code-barres : {{p.barcode}}</li>
            <li>Marque : {{p.brand?.name || 'Générique'}}</li>
            <li>Livraison disponible à Bamako</li>
            <li>Paiement Mobile Money ou à la livraison</li>
          </ul>
          <div class="buy">
            <div class="qty"><button type="button" (click)="dec()">−</button><b>{{q}}</b><button type="button" (click)="inc()">+</button></div>
            <button class="add" type="button" (click)="cart.add(p,q)">🛒 Ajouter au panier</button>
            <a class="wa-order" [href]="orderWa" target="_blank" rel="noopener" aria-label="Commander sur WhatsApp">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.89 14.22c-.25.7-1.45 1.34-2.03 1.42-.52.07-1.18.1-1.91-.12-.44-.13-1.01-.33-1.74-.64-3.06-1.32-5.05-4.4-5.21-4.6-.15-.21-1.26-1.67-1.26-3.19 0-1.51.77-2.26 1.07-2.57.25-.26.66-.37 1.06-.37.13 0 .24 0 .35.01.31.01.46.03.66.51.25.6.84 2.07.91 2.22.08.15.13.32.03.51-.1.2-.15.32-.29.5-.14.17-.3.38-.43.51-.14.14-.28.29-.12.56.16.27.7 1.16 1.5 1.88 1.04.93 1.9 1.22 2.2 1.36.26.12.5.1.69-.06.2-.17.85-.99 1.08-1.33.23-.34.46-.28.76-.17.31.11 1.94.91 2.27 1.08.33.16.55.25.63.38.08.14.08.79-.17 1.49z"/></svg>
            </a>
          </div>
          <app-social-share [product]="p" [share]="share" [settings]="settings.settings()" label="Partager ce produit"></app-social-share>
          <div class="admin-pub" *ngIf="auth.can('CATALOG_MANAGE') || auth.can('ADS_MANAGE')">
            <span>Publier sur les comptes Dibidani</span>
            <button type="button" (click)="publish('WHATSAPP')">WhatsApp</button>
            <button type="button" (click)="publish('FACEBOOK')">Facebook</button>
            <button type="button" (click)="publish('TIKTOK')">TikTok</button>
            <small *ngIf="pubMsg">{{pubMsg}}</small>
          </div>
          <div class="benefits">
            <div>🚚<b>Livraison disponible</b><small>À partir de 1 500 FCFA</small></div>
            <div>💳<b>Paiement sécurisé</b><small>Mobile Money, Carte, COD</small></div>
          </div>
        </div>
      </div>
      <div class="tabs">
        <button type="button" [class.on]="tab==='desc'" (click)="tab='desc'">Description</button>
        <button type="button" [class.on]="tab==='specs'" (click)="tab='specs'">Caractéristiques</button>
        <button type="button" [class.on]="tab==='reviews'" (click)="tab='reviews'">Avis ({{p.reviewCount}})</button>
        <button type="button" [class.on]="tab==='delivery'" (click)="tab='delivery'">Livraison</button>
      </div>
      <div class="description" *ngIf="tab==='desc'">{{p.description || 'Aucune description pour ce produit.'}}</div>
      <div class="description" *ngIf="tab==='specs'">
        <table class="specs" *ngIf="p.specifications?.length; else noSpecs">
          <tr *ngFor="let s of p.specifications"><th>{{s.label}}</th><td>{{s.value}}</td></tr>
        </table>
        <ng-template #noSpecs><p>Aucune caractéristique renseignée.</p></ng-template>
      </div>
      <div class="description" *ngIf="tab==='reviews'">Les avis clients seront affichés ici dès qu’ils seront disponibles.</div>
      <div class="description" *ngIf="tab==='delivery'">Livraison disponible à Bamako. Le délai et les frais sont confirmés après vérification auprès du vendeur.</div>
      <div class="product-ad"><span>PUBLICITÉ</span><div><h3>Accessoires compatibles</h3><p>Découvrez notre sélection disponible au marché.</p></div><a routerLink="/category/all">Voir la sélection →</a></div>
    </main>
  `,
  styles: [`
    .page{padding-top:20px}.breadcrumbs{font-size:12px;color:#76847f;margin-bottom:15px}.breadcrumbs a{color:#087a47;text-decoration:none}
    .detail{display:grid;grid-template-columns:1.05fr .95fr;gap:36px;background:#fff;border:1px solid #e5ece9;border-radius:15px;padding:25px}
    .gallery{display:grid;grid-template-columns:70px 1fr;gap:15px}.gallery.single{grid-template-columns:1fr}.thumbs{display:flex;flex-direction:column;gap:8px;max-height:470px;overflow:auto}
    .thumbs button{padding:0;border:2px solid #dfe7e4;border-radius:8px;background:#fff;cursor:pointer;overflow:hidden}
    .thumbs button.on{border-color:#087a47}
    .thumbs img{width:60px;height:60px;object-fit:contain;display:block}
    .main-img{position:relative;height:470px;background:#f8fbfa;border-radius:12px}.main-img img{width:100%;height:100%;object-fit:contain}
    .main-img .nav{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:36px;border:0;border-radius:50%;background:#ffffffd9;font-size:22px;cursor:pointer}
    .main-img .prev{left:8px}.main-img .next{right:8px}
    .info h1{font-size:30px;margin:5px 0}.stars{color:#ff9200}.stars span{color:#7b8984;font-size:12px}
    .price{font-size:28px;font-weight:900;color:#f34d22;margin:15px 0}.price del{font-size:13px;color:#9da8a4;margin-left:8px}
    .seller{margin:10px 0}.stock{color:#0a9857;font-weight:700}.info li{margin:8px 0;color:#3f514b}
    .buy{display:flex;gap:10px;margin:22px 0;flex-wrap:wrap}
    .qty{display:flex;border:1px solid #dce5e2;border-radius:8px}.qty button{border:0;background:#fff;width:38px}.qty b{display:grid;place-items:center;width:35px}
    .add{flex:1;background:#ff7900;color:#fff;border:0;border-radius:8px;font-size:16px;font-weight:800;min-width:160px}
    .wa-order{display:inline-flex;align-items:center;justify-content:center;background:#128c7e;color:#fff;border-radius:8px;width:48px;text-decoration:none}
    .wa-order svg{width:22px;height:22px;display:block}
    .admin-pub{margin-top:12px;padding:12px;border:1px dashed #c5ddd3;border-radius:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .admin-pub span{width:100%;font-size:12px;color:#3f514b}.admin-pub button{border:0;background:#087a47;color:#fff;border-radius:7px;padding:8px 10px;font-weight:700}
    .admin-pub small{width:100%;color:#087a47}
    .benefits{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.benefits div{border:1px solid #e5ece9;border-radius:10px;padding:13px;display:grid;grid-template-columns:28px 1fr}
    .benefits b{font-size:12px}.benefits small{grid-column:2;color:#71817b}
    .tabs{display:flex;gap:8px;border-bottom:1px solid #e5ece9;margin-top:20px;padding:0 8px;flex-wrap:wrap}
    .tabs button{border:0;background:transparent;padding:15px 12px;color:#5d6e68;cursor:pointer;font:inherit;font-weight:700}
    .tabs button.on{color:#087a47;border-bottom:2px solid #087a47}
    .description{padding:22px;line-height:1.7;background:#fff}
    .specs{width:100%;border-collapse:collapse}.specs th,.specs td{text-align:left;padding:10px 12px;border-bottom:1px solid #edf1ef}
    .specs th{width:34%;color:#4c5e57;font-weight:700}
    .product-ad{display:flex;align-items:center;gap:18px;background:linear-gradient(90deg,#087a47,#0b9a5a);color:#fff;border-radius:12px;padding:20px}
    .product-ad span{font-size:10px;background:#ffffff30;padding:4px}.product-ad div{flex:1}.product-ad h3,.product-ad p{margin:2px}
    .product-ad a{background:#ff7900;color:#fff;padding:11px 16px;border-radius:7px;font-weight:700;text-decoration:none}
    @media(max-width:800px){.detail{grid-template-columns:1fr}.gallery{grid-template-columns:1fr}.thumbs{flex-direction:row;max-height:none}.main-img{height:320px}}
  `]
})
export class ProductComponent implements OnInit {
  p?: Product;
  q = 1;
  photo = 0;
  tab: 'desc' | 'specs' | 'reviews' | 'delivery' = 'desc';
  share: ProductShare | null = null;
  pubMsg = '';
  get gallery() { return this.p ? productGallery(this.p) : []; }
  prevPhoto() { const n = this.gallery.length; if (n) this.photo = (this.photo - 1 + n) % n; }
  nextPhoto() { const n = this.gallery.length; if (n) this.photo = (this.photo + 1) % n; }
  constructor(private route: ActivatedRoute, private api: ApiService, public cart: CartService, public auth: AuthService, public settings: SettingsService) {}

  get orderWa() {
    if (this.share?.orderWhatsappUrl) return this.share.orderWhatsappUrl;
    const p = this.p;
    if (!p) return this.settings.settings().whatsappUrl || 'https://wa.me/22376123456';
    const text = `Bonjour Dibidani, je souhaite commander : ${p.name} (${(p.promoPrice ?? p.price).toLocaleString('fr-FR')} FCFA).`;
    const base = this.settings.settings().whatsappUrl || 'https://wa.me/22376123456';
    return base.split('?')[0] + '?text=' + encodeURIComponent(text);
  }

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.product(slug).subscribe({
      next: p => { this.p = p; this.photo = 0; this.loadShare(slug); },
      error: () => { this.p = demoProduct(slug); }
    });
  }

  loadShare(slug: string) {
    this.api.productShare(slug).subscribe({next: s => this.share = s, error: () => {}});
  }

  publish(channel: SocialChannel) {
    if (!this.p) return;
    this.pubMsg = 'Publication…';
    this.api.publishProduct(this.p.id, [channel]).subscribe({
      next: rows => {
        const r = rows[0];
        this.pubMsg = r?.status === 'FAILED' ? (r.errorMessage || 'Échec') : `Publié sur ${r?.channelLabel} (${r?.mock ? 'démo' : r?.status}).`;
        if (r?.shareUrl) window.open(r.shareUrl, '_blank', 'noopener');
      },
      error: e => this.pubMsg = e.error?.message || 'Connexion requise pour publier depuis le back-office.'
    });
  }

  dec() { this.q = this.q > 1 ? this.q - 1 : 1; }
  inc() { this.q = this.q + 1; }
}
