import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiService} from '../core/api.service';
import {SettingsService} from '../core/settings.service';
import {CmsContent, SiteBlock, SiteBlockKind} from '../core/models';
import {ImagePickerComponent} from '../shared/image-picker.component';
import {ADMIN_PAGE_STYLES} from './admin-ui';

type Tab = 'appearance' | SiteBlockKind;

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ImagePickerComponent],
  template: `
<div class="page">
  <header>
    <div><h1>Contenu du site</h1><p>Réseaux sociaux, page d'accueil, menus, slides et pages — comme un back-office WordPress.</p></div>
  </header>
  <div class="filters">
    <button type="button" [class.on]="tab==='SOCIAL'" (click)="setTab('SOCIAL')">Réseaux sociaux</button>
    <button type="button" [class.on]="tab==='HOME'" (click)="setTab('HOME')">Page d'accueil</button>
    <button type="button" [class.on]="tab==='MENU'" (click)="setTab('MENU')">Menus</button>
    <button type="button" [class.on]="tab==='HERO'" (click)="setTab('HERO')">Hero / slider</button>
    <button type="button" [class.on]="tab==='TESTIMONIAL'" (click)="setTab('TESTIMONIAL')">Témoignages</button>
    <button type="button" [class.on]="tab==='PARTNER'" (click)="setTab('PARTNER')">Partenaires</button>
    <button type="button" [class.on]="tab==='PAGE'" (click)="setTab('PAGE')">Pages</button>
    <button type="button" [class.on]="tab==='FAQ'" (click)="setTab('FAQ')">FAQ</button>
    <button type="button" [class.on]="tab==='appearance'" (click)="setTab('appearance')">Apparence</button>
  </div>
  <p class="msg" *ngIf="msg">{{msg}}</p>
  <p class="err" *ngIf="err">{{err}}</p>

  <form class="card" *ngIf="tab==='appearance'" (submit)="$event.preventDefault(); saveAppearance()">
    <h2>Identité et textes de la vitrine</h2>
    <label class="full">Logo
      <app-image-picker [url]="appearance.logoUrl || ''" (urlChange)="appearance.logoUrl=$event"></app-image-picker>
    </label>
    <label>Bandeau haut<input [(ngModel)]="appearance.topbarText" name="topbarText"></label>
    <label>Badge ville<input [(ngModel)]="appearance.heroLocation" name="heroLocation"></label>
    <label>Sous-badge<input [(ngModel)]="appearance.heroLocationSub" name="heroLocationSub"></label>
    <label>Bandeau flottant<input [(ngModel)]="appearance.floatingBanner" name="floatingBanner"></label>
    <label>Libellé promo (menu)<input [(ngModel)]="appearance.navPromoLabel" name="navPromoLabel"></label>
    <label>Titre témoignages<input [(ngModel)]="appearance.testimonialsTitle" name="testimonialsTitle"></label>
    <label>Sous-titre témoignages<input [(ngModel)]="appearance.testimonialsSubtitle" name="testimonialsSubtitle"></label>
    <label>Titre partenaires<input [(ngModel)]="appearance.partnersTitle" name="partnersTitle"></label>
    <label>Sous-titre partenaires<input [(ngModel)]="appearance.partnersSubtitle" name="partnersSubtitle"></label>
    <label class="full">Texte pied de page<textarea [(ngModel)]="appearance.footerAbout" name="footerAbout"></textarea></label>
    <label class="full">Copyright<input [(ngModel)]="appearance.footerCopyright" name="footerCopyright"></label>
    <div class="actions"><button class="btn" [disabled]="busy">Enregistrer l'apparence</button></div>
  </form>

  <ng-container *ngIf="tab!=='appearance'">
    <p class="muted">{{hint}}</p>
    <div class="filters"><button class="btn" type="button" (click)="edit(null)">+ {{addLabel}}</button></div>
    <form class="card" *ngIf="form" (submit)="$event.preventDefault(); saveBlock()">
      <h2>{{form.id ? 'Modifier' : 'Nouveau'}} — {{label(tab)}}</h2>

      <label *ngIf="tab==='SOCIAL'">Réseau
        <select [(ngModel)]="form.slug" name="slug" required>
          <option [ngValue]="'whatsapp'">WhatsApp</option>
          <option [ngValue]="'facebook'">Facebook</option>
          <option [ngValue]="'instagram'">Instagram</option>
          <option [ngValue]="'tiktok'">TikTok</option>
          <option [ngValue]="'youtube'">YouTube</option>
          <option [ngValue]="'linkedin'">LinkedIn</option>
        </select>
      </label>
      <label *ngIf="tab==='MENU'">Emplacement
        <select [(ngModel)]="form.slug" name="slug" required>
          <option [ngValue]="'header'">Menu du haut (catégories)</option>
          <option [ngValue]="'footer-dibidani'">Pied de page — Dibidani</option>
          <option [ngValue]="'footer-help'">Pied de page — Aide</option>
        </select>
      </label>
      <label *ngIf="tab==='HOME'">Section
        <select [(ngModel)]="form.slug" name="slug" required>
          <option [ngValue]="'trust'">Bandeau confiance (icône + texte)</option>
          <option [ngValue]="'categories'">Nos catégories</option>
          <option [ngValue]="'offers'">Offres du jour</option>
          <option [ngValue]="'ads-top'">Bandeau publicitaire</option>
          <option [ngValue]="'ads-split'">Encarts publicitaires</option>
          <option [ngValue]="'bestsellers'">Meilleures ventes</option>
          <option [ngValue]="'testimonials'">Témoignages</option>
          <option [ngValue]="'partners'">Partenaires</option>
        </select>
      </label>

      <label *ngIf="tab==='FAQ'">Page associée
        <select [(ngModel)]="form.slug" name="slug" required>
          <option *ngFor="let p of data.pages" [ngValue]="p.slug">{{p.title}} (/p/{{p.slug}})</option>
          <option [ngValue]="'faq'" *ngIf="!hasFaqPage">Questions fréquentes (/p/faq)</option>
        </select>
      </label>
      <label>Titre / libellé<input [(ngModel)]="form.title" name="title" required [placeholder]="tab==='FAQ' ? 'Question' : ''"></label>
      <label *ngIf="tab==='PAGE'">Slug<input [(ngModel)]="form.slug" name="slug" placeholder="a-propos"></label>
      <label *ngIf="tab==='HOME' || tab==='TESTIMONIAL' || tab==='PARTNER' || tab==='HERO'">Sous-titre<input [(ngModel)]="form.subtitle" name="subtitle"></label>
      <label *ngIf="tab==='HERO' || tab==='PAGE'" class="full">Texte<textarea [(ngModel)]="form.body" name="body"></textarea></label>
      <label *ngIf="tab==='FAQ'" class="full">Réponse<textarea [(ngModel)]="form.body" name="body" required></textarea></label>
      <label *ngIf="tab==='TESTIMONIAL'" class="full">Citation<textarea [(ngModel)]="form.body" name="body"></textarea></label>
      <label *ngIf="tab==='HERO'" class="full">Image du slider
        <app-image-picker [url]="form.imageUrl || ''" (urlChange)="form.imageUrl=$event"></app-image-picker>
      </label>
      <label *ngIf="tab==='PARTNER'" class="full">Logo
        <app-image-picker [url]="form.imageUrl || ''" (urlChange)="form.imageUrl=$event"></app-image-picker>
      </label>
      <label *ngIf="tab==='SOCIAL' || tab==='MENU' || tab==='HOME' || tab==='HERO' || tab==='PARTNER' || tab==='FAQ'">Lien<input [(ngModel)]="form.linkUrl" name="linkUrl" [placeholder]="tab==='SOCIAL' || tab==='PARTNER' ? 'https://…' : tab==='FAQ' ? '/track' : '/category/all'"></label>
      <label *ngIf="tab==='HERO' || tab==='HOME'">Bouton / « voir tout »<input [(ngModel)]="form.ctaLabel" name="ctaLabel"></label>
      <label *ngIf="tab==='TESTIMONIAL'">Initiales<input [(ngModel)]="form.meta" name="meta" maxlength="4"></label>
      <label *ngIf="tab==='PARTNER'">Couleur<input [(ngModel)]="form.meta" name="meta" placeholder="#087a47"></label>
      <label *ngIf="tab==='HOME'">Icône (bandeau confiance)<input [(ngModel)]="form.meta" name="meta" placeholder="🚚"></label>
      <label *ngIf="tab==='MENU'">Style
        <select [(ngModel)]="form.meta" name="meta">
          <option [ngValue]="''">Normal</option>
          <option [ngValue]="'promo'">Promo (surligné)</option>
          <option [ngValue]="'external'">Lien externe</option>
        </select>
      </label>
      <label>Ordre<input type="number" [(ngModel)]="form.displayOrder" name="displayOrder"></label>
      <label>Actif
        <select [(ngModel)]="form.active" name="active">
          <option [ngValue]="true">Oui — visible sur le site</option>
          <option [ngValue]="false">Non — masqué</option>
        </select>
      </label>
      <div class="actions">
        <button class="btn" [disabled]="busy">Enregistrer</button>
        <button class="btn ghost" type="button" (click)="form=null">Annuler</button>
      </div>
    </form>
    <table>
      <tr><th>{{tab==='MENU' ? 'Emplacement' : tab==='SOCIAL' ? 'Réseau' : tab==='FAQ' ? 'Page' : 'Section'}}</th><th>Titre</th><th>Lien / détail</th><th>Ordre</th><th>Statut</th><th></th></tr>
      <tr *ngFor="let b of blocks()">
        <td>{{place(b)}}</td>
        <td>
          <img *ngIf="(tab==='PARTNER' || tab==='HERO') && b.imageUrl" class="thumb" [src]="b.imageUrl" [alt]="b.title">
          {{b.title}}
        </td>
        <td>{{b.linkUrl || b.imageUrl || b.subtitle || b.ctaLabel || (b.body || '').slice(0, 80) || '—'}}</td>
        <td>{{b.displayOrder}}</td>
        <td><span class="tag" [class.off]="!b.active">{{b.active ? 'Publié' : 'Masqué'}}</span></td>
        <td class="row-actions">
          <button type="button" (click)="edit(b)">Modifier</button>
          <button type="button" (click)="remove(b)">Supprimer</button>
        </td>
      </tr>
    </table>
  </ng-container>
</div>
`,
  styles: [ADMIN_PAGE_STYLES, `
.thumb{height:28px;max-width:72px;object-fit:contain;vertical-align:middle;margin-right:8px;background:#fff}
.preview{margin-top:8px;max-height:56px;max-width:180px;object-fit:contain;background:#f4f8f6;border:1px solid #e7edeb;border-radius:8px;padding:6px}
`]
})
export class AdminCmsComponent implements OnInit {
  tab: Tab = 'SOCIAL';
  data: CmsContent = {appearance: {}, heroes: [], testimonials: [], partners: [], pages: [], socials: [], menus: [], homeSections: [], faqs: []};
  appearance: any = {};
  form: any = null;
  busy = false;
  msg = '';
  err = '';
  constructor(private api: ApiService, private settings: SettingsService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit() {
    this.route.queryParamMap.subscribe(q => {
      const t = q.get('tab') as Tab | null;
      if (t) this.tab = t;
    });
    this.load();
  }
  setTab(t: Tab) {
    this.tab = t;
    this.form = null;
    this.router.navigate([], {queryParams: {tab: t}, queryParamsHandling: 'merge'});
  }
  get hint() {
    return ({
      SOCIAL: 'Les icônes du bandeau et du pied de page. Laissez l’URL vide et masquez un réseau pour le cacher.',
      HOME: 'Affichez, masquez et renommez les blocs de la page d’accueil. Le bandeau confiance accepte plusieurs lignes (icône + texte).',
      MENU: 'Liens de la barre verte (en-tête) et des colonnes du pied de page. Un lien http s’ouvre dans un nouvel onglet.',
      HERO: 'Slides du grand bandeau en haut de la page d’accueil.',
      TESTIMONIAL: 'Avis clients affichés sous le catalogue.',
      PARTNER: 'Ajoutez l’URL du logo (ou un fichier). Sans logo, le nom s’affiche. Lien optionnel vers le site du partenaire.',
      PAGE: 'Pages du site (/p/slug), liées depuis les menus si vous le souhaitez.',
      FAQ: 'Questions-réponses affichées sur la page FAQ (/p/faq). Associez chaque question à la page voulue.',
    } as any)[this.tab] || '';
  }
  get addLabel() {
    return ({SOCIAL: 'réseau', HOME: 'bloc d’accueil', MENU: 'lien de menu', HERO: 'slide', TESTIMONIAL: 'témoignage', PARTNER: 'partenaire', PAGE: 'page', FAQ: 'question'} as any)[this.tab] || 'élément';
  }
  get hasFaqPage() {
    return (this.data.pages || []).some(p => p.slug === 'faq');
  }
  label(k: string) {
    return ({HERO: 'slide', TESTIMONIAL: 'témoignage', PARTNER: 'partenaire', PAGE: 'page', SOCIAL: 'réseau', MENU: 'lien de menu', HOME: 'bloc d’accueil', FAQ: 'question'} as any)[k] || k;
  }
  place(b: SiteBlock) {
    const map: Record<string, string> = {
      whatsapp: 'WhatsApp', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn',
      header: 'En-tête', 'footer-dibidani': 'Pied — Dibidani', 'footer-help': 'Pied — Aide',
      trust: 'Confiance', categories: 'Catégories', offers: 'Offres', 'ads-top': 'Pub haut', 'ads-split': 'Pubs', bestsellers: 'Meilleures ventes', testimonials: 'Témoignages', partners: 'Partenaires',
      faq: 'Page FAQ',
    };
    if (this.tab === 'FAQ') {
      const page = (this.data.pages || []).find(p => p.slug === b.slug);
      return page?.title || map[b.slug || ''] || b.slug || '—';
    }
    return map[b.slug || ''] || b.slug || '—';
  }
  blocks(): SiteBlock[] {
    if (this.tab === 'HERO') return this.data.heroes;
    if (this.tab === 'TESTIMONIAL') return this.data.testimonials;
    if (this.tab === 'PARTNER') return this.data.partners;
    if (this.tab === 'PAGE') return this.data.pages;
    if (this.tab === 'SOCIAL') return this.data.socials || [];
    if (this.tab === 'MENU') return this.data.menus || [];
    if (this.tab === 'HOME') return this.data.homeSections || [];
    if (this.tab === 'FAQ') return this.data.faqs || [];
    return [];
  }
  load() {
    this.api.adminCms().subscribe({
      next: c => {
        this.data = c;
        this.appearance = {...(c.appearance || {})};
      },
      error: e => this.err = e.error?.message || 'Impossible de charger le contenu.'
    });
  }
  edit(b: SiteBlock | null) {
    const defaults: Record<string, string> = {SOCIAL: 'facebook', MENU: 'header', HOME: 'categories', FAQ: 'faq'};
    this.form = b ? {...b} : {
      kind: this.tab, title: '', subtitle: '', body: '', imageUrl: '', linkUrl: '', ctaLabel: '', meta: '',
      slug: defaults[this.tab] || '', displayOrder: this.blocks().length + 1, active: true
    };
  }
  saveAppearance() {
    this.busy = true; this.msg = ''; this.err = '';
    this.api.saveShopSettings(this.appearance).subscribe({
      next: () => { this.busy = false; this.msg = 'Apparence enregistrée. La vitrine est à jour.'; this.settings.reload(); },
      error: e => { this.busy = false; this.err = e.error?.message || 'Enregistrement impossible.'; }
    });
  }
  saveBlock() {
    this.busy = true; this.msg = ''; this.err = '';
    const body = {...this.form, kind: this.tab};
    this.api.saveCmsBlock(body, this.form.id).subscribe({
      next: () => { this.busy = false; this.form = null; this.msg = 'Contenu enregistré. Le site public est à jour.'; this.load(); this.settings.reload(); },
      error: e => { this.busy = false; this.err = e.error?.message || 'Enregistrement impossible.'; }
    });
  }
  remove(b: SiteBlock) {
    if (!b.id || !confirm('Supprimer « ' + b.title + ' » ?')) return;
    this.api.deleteCmsBlock(b.id).subscribe({
      next: () => { this.msg = 'Supprimé.'; this.load(); this.settings.reload(); },
      error: e => this.err = e.error?.message || 'Suppression impossible.'
    });
  }
}
