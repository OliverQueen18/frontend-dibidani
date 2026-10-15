import {Component} from '@angular/core';
import {CommonModule, NgTemplateOutlet} from '@angular/common';
import {RouterLink} from '@angular/router';
import {SettingsService} from '../core/settings.service';
import {SocialIconsComponent} from './social-icons.component';
import {SiteBlock} from '../core/models';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, RouterLink, SocialIconsComponent],
  template: `
    <footer>
      <div class="container foot">
        <div>
          <img [src]="s.logo()" alt="Dibidani">
          <p>{{s.settings().footerAbout || s.settings().slogan || 'Le marché qui vient à vous.'}}</p>
          <app-social-icons [items]="s.socials()"></app-social-icons>
        </div>
        <div>
          <b>Dibidani</b>
          <ng-container *ngIf="dibidani.length; else dibidaniDefault">
            <ng-container *ngFor="let m of dibidani" [ngTemplateOutlet]="item" [ngTemplateOutletContext]="{m:m}"></ng-container>
          </ng-container>
          <ng-template #dibidaniDefault>
            <a routerLink="/">Accueil</a>
            <a routerLink="/category/all">Nos catégories</a>
            <a *ngFor="let p of s.pages()" [routerLink]="['/p', p.slug]">{{p.title}}</a>
          </ng-template>
        </div>
        <div>
          <b>Aide</b>
          <ng-container *ngIf="help.length; else helpDefault">
            <ng-container *ngFor="let m of help" [ngTemplateOutlet]="item" [ngTemplateOutletContext]="{m:m}"></ng-container>
          </ng-container>
          <ng-template #helpDefault>
            <a routerLink="/track">Suivre une commande</a>
            <a routerLink="/p/livraison">Livraison</a>
            <a routerLink="/p/faq">FAQ</a>
            <a [href]="s.settings().whatsappUrl || 'https://wa.me/22376123456'" target="_blank" rel="noopener">WhatsApp</a>
          </ng-template>
        </div>
        <div>
          <b>Contact</b>
          <p>📍 {{s.settings().address || 'Bamako, Mali'}}</p>
          <p>💬 {{s.settings().whatsapp || s.settings().phone || '+223 76 12 34 56'}}</p>
        </div>
      </div>
      <div class="copy">{{s.settings().footerCopyright || '© 2026 Dibidani. Tous droits réservés.'}}</div>
    </footer>
    <ng-template #item let-m="m">
      <a *ngIf="!s.isExternal(m.linkUrl)" [routerLink]="m.linkUrl">{{m.title}}</a>
      <a *ngIf="s.isExternal(m.linkUrl)" [href]="m.linkUrl" target="_blank" rel="noopener">{{m.title}}</a>
    </ng-template>
  `,
  styles: [`
    footer{margin-top:0;background:#082f24;color:#fff}
    .foot{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:35px;padding:45px 0}
    .foot img{width:170px;background:#fff;border-radius:8px}
    .foot div{display:flex;flex-direction:column;gap:9px}
    .foot a,.foot p{color:#cfe2da;font-size:14px;text-decoration:none}
    app-social-icons{margin-top:8px}
    .copy{text-align:center;border-top:1px solid #ffffff1c;padding:16px;color:#b9d4ca;font-size:12px}
    @media(max-width:700px){.foot{grid-template-columns:1fr 1fr;gap:22px;padding:28px 0}}
    @media(max-width:480px){.foot{grid-template-columns:1fr}.foot img{width:140px}}
  `]
})
export class FooterComponent {
  constructor(public s: SettingsService) {}
  get dibidani(): SiteBlock[] { return this.s.menu('footer-dibidani'); }
  get help(): SiteBlock[] { return this.s.menu('footer-help'); }
}
