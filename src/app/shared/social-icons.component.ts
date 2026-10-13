import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SiteBlock} from '../core/models';

@Component({
  selector: 'app-social-icons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="social" [class.compact]="compact" aria-label="Réseaux sociaux">
      <a *ngFor="let n of list" [class]="n.slug || ''" [href]="n.linkUrl!" target="_blank" rel="noopener" [attr.aria-label]="n.title">
        <svg *ngIf="n.slug==='whatsapp'" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.89 14.22c-.25.7-1.45 1.34-2.03 1.42-.52.07-1.18.1-1.91-.12-.44-.13-1.01-.33-1.74-.64-3.06-1.32-5.05-4.4-5.21-4.6-.15-.21-1.26-1.67-1.26-3.19 0-1.51.77-2.26 1.07-2.57.25-.26.66-.37 1.06-.37.13 0 .24 0 .35.01.31.01.46.03.66.51.25.6.84 2.07.91 2.22.08.15.13.32.03.51-.1.2-.15.32-.29.5-.14.17-.3.38-.43.51-.14.14-.28.29-.12.56.16.27.7 1.16 1.5 1.88 1.04.93 1.9 1.22 2.2 1.36.26.12.5.1.69-.06.2-.17.85-.99 1.08-1.33.23-.34.46-.28.76-.17.31.11 1.94.91 2.27 1.08.33.16.55.25.63.38.08.14.08.79-.17 1.49z"/></svg>
        <svg *ngIf="n.slug==='facebook'" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 12.07C22 6.48 17.52 2 11.93 2 6.35 2 1.87 6.48 1.87 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.41V9.84c0-2.38 1.42-3.7 3.6-3.7 1.04 0 2.13.19 2.13.19v2.34h-1.2c-1.18 0-1.55.73-1.55 1.48v1.78h2.64l-.42 2.91h-2.22V22c4.78-.75 8.44-4.91 8.44-9.93z"/></svg>
        <svg *ngIf="n.slug==='tiktok'" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.2 3v2.7a5.6 5.6 0 0 0 3.5 1.2v2.6a8 8 0 0 1-3.5-1v6.2a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.8a2.9 2.9 0 1 0 2 2.8V3h2.8z"/></svg>
        <svg *ngIf="n.slug==='instagram'" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm8 1.8H8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8A3.2 3.2 0 0 0 19.2 16V8A3.2 3.2 0 0 0 16 4.8zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.4 7.1a1 1 0 1 1-1-1 1 1 0 0 1 1 1z"/></svg>
        <svg *ngIf="n.slug==='youtube'" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.6V8.8l6.2 3.4-6.2 3.4z"/></svg>
        <svg *ngIf="n.slug==='linkedin'" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.5 9.5H3.7V20h2.8V9.5zM5.1 4A1.6 1.6 0 1 0 5.1 7.2 1.6 1.6 0 0 0 5.1 4zM20.3 20h-2.8v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V20H11V9.5h2.7v1.4h.1c.4-.7 1.3-1.5 2.7-1.5 2.9 0 3.4 1.9 3.4 4.4V20z"/></svg>
        <span *ngIf="!known(n.slug)">{{(n.title || '?').slice(0,1)}}</span>
      </a>
    </nav>
  `,
  styles: [`
    :host{display:inline-flex}
    .social{display:flex;gap:8px;align-items:center}
    .social a{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#fff;text-decoration:none;flex-shrink:0;background:#087a47}
    .social svg{width:18px;height:18px;display:block}
    .compact a{width:32px;height:32px}
    .compact svg{width:15px;height:15px}
    .whatsapp{background:#128c7e}
    .facebook{background:#1877f2}
    .tiktok{background:#111}
    .youtube{background:#ff0000}
    .linkedin{background:#0a66c2}
    .instagram{background:radial-gradient(circle at 30% 107%,#fdf497 0,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285aeb 90%)}
    .social a:hover{transform:translateY(-1px);filter:brightness(1.08)}
  `]
})
export class SocialIconsComponent {
  @Input() items: SiteBlock[] | null = null;
  @Input() whatsapp?: string | null;
  @Input() facebook?: string | null;
  @Input() tiktok?: string | null;
  @Input() instagram?: string | null;
  @Input() youtube?: string | null;
  @Input() linkedin?: string | null;
  @Input() compact = false;

  get list(): SiteBlock[] {
    if (this.items?.length) return this.items.filter(i => !!i.linkUrl);
    return ([
      {kind: 'SOCIAL' as const, slug: 'whatsapp', title: 'WhatsApp', linkUrl: this.whatsapp},
      {kind: 'SOCIAL' as const, slug: 'facebook', title: 'Facebook', linkUrl: this.facebook},
      {kind: 'SOCIAL' as const, slug: 'instagram', title: 'Instagram', linkUrl: this.instagram},
      {kind: 'SOCIAL' as const, slug: 'tiktok', title: 'TikTok', linkUrl: this.tiktok},
      {kind: 'SOCIAL' as const, slug: 'youtube', title: 'YouTube', linkUrl: this.youtube},
      {kind: 'SOCIAL' as const, slug: 'linkedin', title: 'LinkedIn', linkUrl: this.linkedin},
    ] as SiteBlock[]).filter(i => !!i.linkUrl);
  }

  known(slug?: string | null) {
    return ['whatsapp', 'facebook', 'tiktok', 'instagram', 'youtube', 'linkedin'].includes(slug || '');
  }
}
