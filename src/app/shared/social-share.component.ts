import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Product, ProductShare, ShopSettings} from '../core/models';
import {SocialIconsComponent} from './social-icons.component';

@Component({
  selector: 'app-social-share',
  standalone: true,
  imports: [CommonModule, SocialIconsComponent],
  template: `
    <div class="share">
      <span>{{label}}</span>
      <app-social-icons [whatsapp]="whatsapp" [facebook]="facebook" [tiktok]="tiktok"></app-social-icons>
    </div>
  `,
  styles: [`
    .share{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px}
    .share>span{font-size:12px;color:#5d6f68;margin-right:4px}
  `]
})
export class SocialShareComponent {
  @Input() product?: Product;
  @Input() share?: ProductShare | null;
  @Input() settings?: ShopSettings | null;
  @Input() label = 'Partager';

  get caption() {
    if (this.share?.caption) return this.share.caption;
    const p = this.product;
    if (!p) return '';
    const price = (p.promoPrice ?? p.price).toLocaleString('fr-FR');
    return `${p.name}\nFCFA ${price}\nLivraison à Bamako · Dibidani`;
  }
  get url() { return this.share?.productUrl || (typeof location === 'undefined' ? '' : location.href); }
  get whatsapp() { return this.share?.whatsappUrl || 'https://wa.me/?text=' + encodeURIComponent(this.caption + '\n' + this.url); }
  get facebook() { return this.share?.facebookUrl || 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(this.url); }
  get tiktok() { return this.share?.tiktokUrl || 'https://www.tiktok.com/upload?lang=fr'; }
}
