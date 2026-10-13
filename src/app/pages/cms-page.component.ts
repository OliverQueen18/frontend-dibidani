import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ApiService} from '../core/api.service';
import {SettingsService} from '../core/settings.service';
import {SiteBlock} from '../core/models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<main class="container page" *ngIf="block">
  <p class="crumb"><a routerLink="/">Accueil</a> / {{block.title}}</p>
  <h1>{{block.title}}</h1>
  <p class="sub" *ngIf="block.subtitle">{{block.subtitle}}</p>
  <div class="body" *ngIf="block.body">{{block.body}}</div>
  <div class="faq" *ngIf="faqs.length">
    <details *ngFor="let q of faqs">
      <summary>{{q.title}}</summary>
      <p>{{q.body}}</p>
      <a *ngIf="usefulLink(q) && !s.isExternal(q.linkUrl)" [routerLink]="q.linkUrl">En savoir plus →</a>
      <a *ngIf="usefulLink(q) && s.isExternal(q.linkUrl)" [href]="q.linkUrl" target="_blank" rel="noopener">En savoir plus →</a>
    </details>
  </div>
</main>
<p class="container" *ngIf="missing">Cette page n'existe pas ou n'est plus publiée.</p>
`,
  styles: [`
.page{padding:36px 0 64px;max-width:760px}
.crumb,.sub{color:#6a7c75;font-size:13px}
h1{margin:8px 0 10px;color:#173b30}
.body{white-space:pre-wrap;line-height:1.6;color:#173c31;margin-bottom:22px}
.faq{display:flex;flex-direction:column;gap:10px}
.faq details{background:#fff;border:1px solid #e7edeb;border-radius:12px;padding:0 16px;overflow:hidden}
.faq summary{cursor:pointer;font-weight:800;color:#173b30;padding:16px 4px;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'+';color:#087a47;font-size:20px;font-weight:700;line-height:1}
.faq details[open] summary::after{content:'–'}
.faq details[open] summary{border-bottom:1px solid #edf1ef}
.faq p{margin:12px 4px 16px;line-height:1.6;color:#2d463d;white-space:pre-wrap}
.faq a{display:inline-block;margin:0 4px 16px;color:#087a47;font-weight:700;font-size:13px;text-decoration:none}
`]
})
export class CmsPageComponent implements OnInit {
  block: SiteBlock | null = null;
  missing = false;
  constructor(private route: ActivatedRoute, private api: ApiService, public s: SettingsService) {}
  get faqs(): SiteBlock[] {
    return this.s.faqs(this.block?.slug || 'faq');
  }
  usefulLink(q: SiteBlock) {
    const url = q.linkUrl || '';
    if (!url) return false;
    const self = '/p/' + (this.block?.slug || 'faq');
    return url !== self;
  }
  ngOnInit() {
    this.route.paramMap.subscribe(p => {
      const slug = p.get('slug') || '';
      this.api.cmsPage(slug).subscribe({
        next: b => { this.block = b; this.missing = false; },
        error: () => { this.block = null; this.missing = true; }
      });
    });
  }
}
