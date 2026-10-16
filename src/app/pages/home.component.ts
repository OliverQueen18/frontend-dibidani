import {Component,OnDestroy,OnInit,effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {ApiService} from '../core/api.service';
import {SettingsService} from '../core/settings.service';
import {Advertisement,HomeData,Product} from '../core/models';
import {ProductCardComponent} from '../shared/product-card.component';
import {DEMO_HOME} from '../core/demo-data';

@Component({standalone:true,imports:[CommonModule,RouterLink,ProductCardComponent],template:`
<section class="hero">
  <div class="container">
    <div class="hero-slider" (mouseenter)="pause()" (mouseleave)="play()">
      <article class="hero-slide" *ngFor="let slide of slides; let i = index" [class.active]="i===current">
        <a *ngIf="!external(slide)" [routerLink]="ctaHref(slide)" [attr.aria-label]="slide.title">
          <img [src]="img(slide)" [alt]="slide.title" (error)="onImgError($event)">
        </a>
        <a *ngIf="external(slide)" [href]="ctaHref(slide)" target="_blank" rel="noopener" [attr.aria-label]="slide.title">
          <img [src]="img(slide)" [alt]="slide.title" (error)="onImgError($event)">
        </a>
      </article>
      <button class="hero-nav prev" type="button" (click)="prev()" *ngIf="slides.length>1" aria-label="Slide précédent">‹</button>
      <button class="hero-nav next" type="button" (click)="next()" *ngIf="slides.length>1" aria-label="Slide suivant">›</button>
      <div class="hero-dots" *ngIf="slides.length>1">
        <button type="button" *ngFor="let s of slides; let i = index" [class.on]="i===current" (click)="go(i)" [attr.aria-label]="'Aller au slide '+(i+1)"></button>
      </div>
    </div>
  </div>
</section>
<section class="trust" *ngIf="s.homeOn('trust')">
  <div class="container trust-row">
    <div *ngFor="let t of trustItems">{{t.meta || '•'}}<b>{{t.title}}</b><span>{{t.subtitle}}</span></div>
  </div>
</section>
<main class="container" *ngIf="data">
  <ng-container *ngIf="s.homeOn('categories')">
    <div class="section-head"><h2>{{s.homeTitle('categories','Nos catégories')}}</h2><a [routerLink]="s.homeLink('categories')">{{s.homeCta('categories','Voir toutes')}} →</a></div>
    <div class="category-grid"><a *ngFor="let c of categories" [routerLink]="['/category',c.slug]" class="category-card"><div>{{c.icon}}</div><b>{{c.name}}</b></a></div>
  </ng-container>
  <div class="ad-banner" *ngIf="s.homeOn('ads-top')"><span>PUBLICITÉ</span><div><b>{{topAd?.title || 'Votre publicité ici'}}</b><small>{{topAd?.description || topAd?.subtitle || 'Touchez des milliers de clients chaque jour'}}</small></div><a *ngIf="topAd && !external(topAd)" [routerLink]="ctaHref(topAd)">{{cta(topAd)}}</a><a *ngIf="topAd && external(topAd)" [href]="ctaHref(topAd)" target="_blank" rel="noopener">{{cta(topAd)}}</a><a *ngIf="!topAd" routerLink="/category/all">En savoir plus</a></div>
  <ng-container *ngIf="s.homeOn('offers')">
    <div class="section-head"><h2>{{s.homeTitle('offers','Offres du jour 🔥')}}</h2><a [routerLink]="s.homeLink('offers')">{{s.homeCta('offers','Voir toutes')}} →</a></div>
    <div class="product-grid"><app-product-card *ngFor="let p of offers" [p]="p"></app-product-card></div>
  </ng-container>
  <div class="ad-split" *ngIf="s.homeOn('ads-split')"><div class="ad-block solar"><small>PUBLICITÉ</small><h3>{{middleAd?.title || 'Panneaux solaires pour un Mali plus lumineux'}}</h3><a *ngIf="middleAd && !external(middleAd)" [routerLink]="ctaHref(middleAd)">{{cta(middleAd)}} →</a><button *ngIf="!middleAd">Découvrir →</button></div><div class="ad-block brand"><small>PUBLICITÉ</small><h3>{{bottomAd?.title || 'Des marques fiables, disponibles à Dibidani'}}</h3><a *ngIf="bottomAd && !external(bottomAd)" [routerLink]="ctaHref(bottomAd)">{{cta(bottomAd)}}</a><button *ngIf="!bottomAd">Voir les offres</button></div></div>
  <ng-container *ngIf="s.homeOn('bestsellers')">
    <div class="section-head"><h2>{{s.homeTitle('bestsellers','Meilleures ventes')}}</h2><a [routerLink]="s.homeLink('bestsellers')">{{s.homeCta('bestsellers','Voir toutes')}} →</a></div>
    <div class="product-grid"><app-product-card *ngFor="let p of best" [p]="p"></app-product-card></div>
  </ng-container>
</main>
<section class="quotes" *ngIf="s.homeOn('testimonials')">
  <div class="container">
    <div class="section-head"><h2>{{s.homeTitle('testimonials', s.settings().testimonialsTitle || 'Témoignages')}}</h2><span>{{s.homeSubtitle('testimonials', s.settings().testimonialsSubtitle || 'Ce que disent nos clients à Bamako')}}</span></div>
    <div class="quote-grid">
      <article *ngFor="let t of s.cms().testimonials">
        <div class="stars">★★★★★</div>
        <p>« {{t.body}} »</p>
        <div class="who"><i>{{t.meta || (t.title || '?').slice(0,2)}}</i><div><b>{{t.title}}</b><small>{{t.subtitle}}</small></div></div>
      </article>
    </div>
  </div>
</section>
<section class="partners" *ngIf="s.homeOn('partners')">
  <div class="container">
    <div class="section-head"><h2>{{s.homeTitle('partners', s.settings().partnersTitle || 'Nos partenaires')}}</h2><span>{{s.homeSubtitle('partners', s.settings().partnersSubtitle || 'Marques et services disponibles à Dibidani')}}</span></div>
    <div class="partner-row">
      <article *ngFor="let p of s.cms().partners">
        <a *ngIf="p.linkUrl" class="partner-mark" [href]="p.linkUrl" [attr.target]="s.isExternal(p.linkUrl) ? '_blank' : null" rel="noopener">
          <img *ngIf="p.imageUrl" [src]="p.imageUrl" [alt]="p.title">
          <b *ngIf="!p.imageUrl" [style.color]="p.meta || '#087a47'">{{p.title}}</b>
        </a>
        <span *ngIf="!p.linkUrl" class="partner-mark">
          <img *ngIf="p.imageUrl" [src]="p.imageUrl" [alt]="p.title">
          <b *ngIf="!p.imageUrl" [style.color]="p.meta || '#087a47'">{{p.title}}</b>
        </span>
        <small *ngIf="p.subtitle">{{p.subtitle}}</small>
      </article>
    </div>
  </div>
</section>
`,styles:[`
.hero{padding:12px 0 8px}
.hero-slider{position:relative;width:100%;aspect-ratio:1942/809;border-radius:18px;overflow:hidden;background:#eef4f1;isolation:isolate}
.hero-slide{position:absolute;inset:0;opacity:0;transition:opacity .7s ease}
.hero-slide.active{opacity:1}
.hero-slide>a{display:block;width:100%;height:100%}
.hero-slide img{width:100%;height:100%;object-fit:contain;object-position:center;display:block}
.hero-nav{position:absolute;top:50%;z-index:3;transform:translateY(-50%);width:34px;height:34px;border:0;border-radius:50%;background:#ffffffd9;color:#0e4f36;font-size:22px;line-height:1;display:grid;place-items:center;box-shadow:0 4px 14px #00000024}
.hero-nav.prev{left:10px}
.hero-nav.next{right:10px}
.hero-dots{position:absolute;left:0;right:0;bottom:12px;z-index:3;display:flex;justify-content:center;gap:7px}
.hero-dots button{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:#ffffff8a;cursor:pointer}
.hero-dots button.on{width:22px;border-radius:8px;background:#fff}
.trust{background:#fff}
.trust-row{display:grid;grid-template-columns:repeat(4,1fr);padding:18px 0}
.trust-row div{display:grid;grid-template-columns:32px 1fr;font-size:24px;border-right:1px solid #e8efec;padding:0 20px}
.trust-row b{font-size:13px;color:#213b33}
.trust-row span{grid-column:2;font-size:11px;color:#7d8b86}
.section-head{display:flex;align-items:center;justify-content:space-between;margin:30px 0 14px;gap:12px}
.section-head h2{margin:0;color:#173b30}
.section-head a{color:#087a47;font-size:13px;white-space:nowrap}
.category-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:10px}
.category-card{background:#fff;border:1px solid #e7edeb;border-radius:12px;padding:15px 8px;text-align:center;color:#173b30;text-decoration:none}
.category-card div{font-size:35px}
.category-card b{font-size:11px}
.product-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.ad-banner{margin:26px 0;background:linear-gradient(90deg,#ffd688,#fff2d5,#ffb556);border-radius:12px;min-height:90px;display:flex;align-items:center;gap:22px;padding:15px 25px;color:#263931;flex-wrap:wrap}
.ad-banner>span{font-size:10px;background:#087a47;color:#fff;border-radius:4px;padding:4px 7px}
.ad-banner div{display:flex;flex-direction:column;flex:1;min-width:0}
.ad-banner b{font-size:20px}
.ad-banner small{color:#6a5d43}
.ad-banner a{background:#087a47;color:#fff;border-radius:7px;padding:10px 15px;text-decoration:none;font-weight:700}
.ad-split{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:26px 0}
.ad-block{padding:28px;border-radius:14px;color:#fff;min-height:160px}
.ad-block small{background:#ffffff30;padding:4px}
.ad-block h3{font-size:clamp(18px,2.4vw,25px);max-width:420px}
.solar{background:linear-gradient(120deg,#925100,#ff8c00)}
.brand{background:linear-gradient(120deg,#065f3b,#0ca467)}
.ad-block button,.ad-block a{display:inline-flex;border:0;background:#fff;padding:10px 15px;border-radius:7px;color:#18523d;font-weight:700;text-decoration:none}
.quotes{margin-top:42px;padding:36px 0 8px;background:#fff}
.quotes .section-head span,.partners .section-head span{color:#7d8b86;font-size:13px}
.quote-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.quote-grid article{border:1px solid #e7edeb;border-radius:14px;padding:22px 20px;background:#f8fbf9}
.quote-grid .stars{color:#ff9200;letter-spacing:1px;margin-bottom:10px}
.quote-grid p{margin:0 0 18px;color:#2d463d;line-height:1.55;font-size:14px}
.who{display:flex;align-items:center;gap:10px}
.who i{width:42px;height:42px;border-radius:50%;background:#087a47;color:#fff;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:13px}
.who b{display:block;font-size:13px;color:#173b30}
.who small{color:#7d8b86;font-size:12px}
.partners{padding:28px 0 40px;background:#f4f8f6}
.partner-row{display:grid;grid-template-columns:repeat(8,1fr);gap:10px}
.partner-row article{background:#fff;border:1px solid #e7edeb;border-radius:12px;min-height:88px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px;text-align:center}
.partner-mark{display:flex;align-items:center;justify-content:center;min-height:42px;text-decoration:none;color:inherit}
.partner-mark img{max-width:100%;max-height:42px;object-fit:contain}
.partner-row b{font-size:13px;letter-spacing:-.02em}
.partner-row small{margin-top:4px;color:#7d8b86;font-size:10px}
@media(max-width:1000px){
  .category-grid{grid-template-columns:repeat(4,1fr)}
  .product-grid{grid-template-columns:repeat(3,1fr)}
  .partner-row{grid-template-columns:repeat(4,1fr)}
}
@media(max-width:700px){
  .trust-row{grid-template-columns:1fr 1fr;gap:15px}
  .trust-row div{border-right:0}
  .category-grid{grid-template-columns:repeat(4,1fr)}
  .product-grid{grid-template-columns:repeat(2,1fr)}
  .ad-split{grid-template-columns:1fr}
  .ad-banner{padding:14px}
  .quote-grid{grid-template-columns:1fr}
  .partner-row{grid-template-columns:repeat(2,1fr)}
  .quotes .section-head,.partners .section-head{flex-direction:column;align-items:flex-start}
}
`]
})
export class HomeComponent implements OnInit, OnDestroy {
  data: HomeData = DEMO_HOME;
  slides: Advertisement[] = HomeComponent.defaults;
  current = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private apiHeroes: Advertisement[] = [];
  private readonly fallback = 'assets/hero-market.jpg';
  private static readonly defaults: Advertisement[] = [
    {title:'Le grand marché de Bamako, à portée de main',description:'Commandez vos produits du marché en ligne et recevez-les facilement chez vous, au bureau ou partout à Bamako.',imageUrl:'assets/hero-market.jpg',targetUrl:'/category/all',ctaLabel:'Découvrir nos offres'},
    {title:'Pièces auto et moto au meilleur prix',description:'Batteries, huiles et filtres des meilleures marques, livrés en 24 h à Bamako.',imageUrl:'assets/hero-market.jpg',targetUrl:'/category/pieces-detachees',ctaLabel:'Voir les pièces'},
    {title:'Passez à l\'énergie solaire',description:'Kits solaires et équipements électriques pour la maison et le commerce.',imageUrl:'assets/hero-market.jpg',targetUrl:'/category/energie-solaire',ctaLabel:'Je m\'équipe'},
  ];

  constructor(private api: ApiService, public s: SettingsService) {
    effect(() => {
      this.s.cms();
      this.applySlides();
    });
  }

  get trustItems() { const rows = this.s.homeItems('trust'); return rows.length ? rows : [{kind:'HOME' as const, slug:'trust', title:'Livraison rapide', subtitle:'À Bamako et environs', meta:'🚚'}]; }
  get categories() { return (this.data.categories || []).filter(c => !c.parentId); }
  get offers(): Product[] { return this.data.promotions?.length ? this.data.promotions : (this.data.featured || []); }
  get best(): Product[] { return this.data.popular?.length ? this.data.popular : (this.data.bestSellers || []); }
  get topAd(): Advertisement | undefined { return this.data.topAds?.[0]; }
  get middleAd(): Advertisement | undefined { return this.data.middleAds?.[0]; }
  get bottomAd(): Advertisement | undefined { return this.data.bottomAds?.[0]; }


  ngOnInit() {
    this.play();
    this.api.home().subscribe({
      next: d => {
        this.data = {
          ...DEMO_HOME,
          ...d,
          categories: d.categories?.length ? d.categories : DEMO_HOME.categories,
          promotions: d.promotions?.length ? d.promotions : DEMO_HOME.promotions,
          popular: d.popular?.length ? d.popular : DEMO_HOME.popular,
          featured: d.featured?.length ? d.featured : DEMO_HOME.featured,
          bestSellers: d.bestSellers?.length ? d.bestSellers : DEMO_HOME.bestSellers,
          heroAds: d.heroAds || [],
          topAds: d.topAds?.length ? d.topAds : DEMO_HOME.topAds,
          middleAds: d.middleAds?.length ? d.middleAds : DEMO_HOME.middleAds,
          bottomAds: d.bottomAds?.length ? d.bottomAds : DEMO_HOME.bottomAds,
        };
        this.apiHeroes = d.heroAds || [];
        this.applySlides();
      },
      error: () => {
        this.data = DEMO_HOME;
        this.apiHeroes = [];
        this.applySlides();
      }
    });
  }

  ngOnDestroy() { this.pause(); }

  private applySlides() {
    const cms = (this.s.cms().heroes || [])
      .filter(h => h.active !== false)
      .map(h => ({
        title: h.title,
        description: h.body || h.subtitle || '',
        imageUrl: h.imageUrl || undefined,
        targetUrl: h.linkUrl || '/category/all',
        ctaLabel: h.ctaLabel || 'Découvrir'
      } as Advertisement));
    const next = cms.length ? cms : (this.apiHeroes.length ? this.apiHeroes : HomeComponent.defaults);
    const same = next.length === this.slides.length
      && next.every((s, i) => s.title === this.slides[i].title && s.imageUrl === this.slides[i].imageUrl && s.description === this.slides[i].description);
    if (same) return;
    this.slides = next;
    this.current = 0;
    this.play();
  }

  img(s: Advertisement) { return s.imageUrl || this.fallback; }
  onImgError(ev: Event) {
    const el = ev.target as HTMLImageElement;
    if (!el || el.src.includes('hero-market')) return;
    el.src = this.fallback;
  }
  cta(s: Advertisement) { return s.ctaLabel || 'Découvrir nos offres'; }
  ctaHref(s: Advertisement) { return s.targetUrl || '/category/all'; }
  external(s: Advertisement) { return !!s.external || /^https?:\/\//.test(s.targetUrl || ''); }

  play() {
    this.pause();
    if (this.slides.length < 2) return;
    this.timer = setInterval(() => this.next(), 5500);
  }
  pause() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
  next() { this.current = (this.current + 1) % this.slides.length; }
  prev() { this.current = (this.current - 1 + this.slides.length) % this.slides.length; }
  go(i: number) { this.current = i; }
}
