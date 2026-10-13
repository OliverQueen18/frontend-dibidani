import {Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Category, CmsContent, ShopSettings, SiteBlock} from './models';
import {DEMO_CATEGORIES, DEMO_SETTINGS} from './demo-data';

const DEMO_CMS: CmsContent = {
  appearance: {},
  heroes: [],
  socials: [
    {kind:'SOCIAL', slug:'whatsapp', title:'WhatsApp', linkUrl:'https://wa.me/22376123456'},
    {kind:'SOCIAL', slug:'facebook', title:'Facebook', linkUrl:'https://www.facebook.com/dibidani'},
    {kind:'SOCIAL', slug:'tiktok', title:'TikTok', linkUrl:'https://www.tiktok.com/@dibidani'},
  ],
  menus: [
    {kind:'MENU', slug:'header', title:'Toutes les catégories', linkUrl:'/category/all', displayOrder:1},
    {kind:'MENU', slug:'header', title:'Promotions', linkUrl:'/category/all', meta:'promo', displayOrder:9},
    {kind:'MENU', slug:'footer-dibidani', title:'Accueil', linkUrl:'/', displayOrder:1},
    {kind:'MENU', slug:'footer-dibidani', title:'Nos catégories', linkUrl:'/category/all', displayOrder:2},
    {kind:'MENU', slug:'footer-help', title:'Suivre une commande', linkUrl:'/track', displayOrder:1},
    {kind:'MENU', slug:'footer-help', title:'Livraison', linkUrl:'/p/livraison', displayOrder:2},
    {kind:'MENU', slug:'footer-help', title:'FAQ', linkUrl:'/p/faq', displayOrder:3},
  ],
  homeSections: [
    {kind:'HOME', slug:'trust', title:'Livraison rapide', subtitle:'À Bamako et environs', meta:'🚚'},
    {kind:'HOME', slug:'trust', title:'Paiement sécurisé', subtitle:'Mobile Money, carte, COD', meta:'💳'},
    {kind:'HOME', slug:'trust', title:'Produits de qualité', subtitle:'Vendeurs vérifiés', meta:'🛡️'},
    {kind:'HOME', slug:'trust', title:'Service client', subtitle:'Assistance WhatsApp', meta:'💬'},
    {kind:'HOME', slug:'categories', title:'Nos catégories', linkUrl:'/category/all', ctaLabel:'Voir toutes'},
    {kind:'HOME', slug:'offers', title:'Offres du jour 🔥', linkUrl:'/category/all', ctaLabel:'Voir toutes'},
    {kind:'HOME', slug:'ads-top', title:'Bandeau publicitaire'},
    {kind:'HOME', slug:'ads-split', title:'Encarts publicitaires'},
    {kind:'HOME', slug:'bestsellers', title:'Meilleures ventes', linkUrl:'/category/all', ctaLabel:'Voir toutes'},
    {kind:'HOME', slug:'testimonials', title:'Témoignages', subtitle:'Ce que disent nos clients à Bamako'},
    {kind:'HOME', slug:'partners', title:'Nos partenaires', subtitle:'Marques et services disponibles à Dibidani'},
  ],
  testimonials: [
    {kind:'TESTIMONIAL', title:'Aminata Traoré', subtitle:'Hamdallaye, Bamako', body:'La perceuse est arrivée le lendemain. Paiement Orange Money, sans file d\'attente au marché.', meta:'AT'},
    {kind:'TESTIMONIAL', title:'Moussa Diallo', subtitle:'Badalabougou, Bamako', body:'Je commande le riz et l\'huile depuis mon bureau. Livraison soignée, prix du marché.', meta:'MD'},
    {kind:'TESTIMONIAL', title:'Fatoumata Coulibaly', subtitle:'ACI 2000, Bamako', body:'Le kit solaire a été livré chez moi. Le vendeur a répondu tout de suite sur WhatsApp.', meta:'FC'},
  ],
  partners: [
    {kind:'PARTNER', title:'Samsung', subtitle:'Électronique', meta:'#1428a0'},
    {kind:'PARTNER', title:'Bosch', subtitle:'Outillage', meta:'#ea0016'},
    {kind:'PARTNER', title:'TotalEnergies', subtitle:'Lubrifiants', meta:'#dd2c00'},
    {kind:'PARTNER', title:'Varta', subtitle:'Batteries', meta:'#0b6b3a'},
    {kind:'PARTNER', title:'Orange Money', subtitle:'Paiement', meta:'#ff7900'},
    {kind:'PARTNER', title:'Moov Money', subtitle:'Paiement', meta:'#0066b3'},
    {kind:'PARTNER', title:'Wave', subtitle:'Paiement', meta:'#1dc4c4'},
    {kind:'PARTNER', title:'Electro Mali', subtitle:'Vendeur', meta:'#087a47'},
  ],
  pages: [],
  faqs: [
    {kind:'FAQ', slug:'faq', title:'Qu’est-ce que Dibidani ?', body:'Dibidani est le marché de Bamako en ligne : pièces, quincaillerie, alimentation et plus, livrés chez vous.', displayOrder:1},
    {kind:'FAQ', slug:'faq', title:'Comment passer une commande ?', body:'Ajoutez des produits au panier, validez l’adresse et le paiement. Nous confirmons après vérification auprès des vendeurs.', displayOrder:2},
    {kind:'FAQ', slug:'faq', title:'Comment suivre ma commande ?', body:'Utilisez le numéro reçu par SMS ou e-mail sur la page Suivre une commande.', linkUrl:'/track', displayOrder:3},
  ],
};

@Injectable({providedIn: 'root'})
export class SettingsService {
  settings = signal<ShopSettings>(DEMO_SETTINGS);
  cms = signal<CmsContent>(DEMO_CMS);
  categories = signal<Category[]>(DEMO_CATEGORIES);

  constructor(private http: HttpClient) { this.reload(); }

  reload() {
    this.http.get<ShopSettings>('/api/v1/public/settings').subscribe({
      next: s => this.settings.set({...DEMO_SETTINGS, ...s}),
      error: () => this.settings.set(DEMO_SETTINGS),
    });
    this.http.get<CmsContent>('/api/v1/public/cms').subscribe({
      next: c => this.cms.set({
        appearance: c.appearance || {},
        heroes: c.heroes?.length ? c.heroes : DEMO_CMS.heroes,
        testimonials: c.testimonials?.length ? c.testimonials : DEMO_CMS.testimonials,
        partners: c.partners?.length ? c.partners : DEMO_CMS.partners,
        pages: c.pages || [],
        socials: c.socials?.length ? c.socials : DEMO_CMS.socials,
        menus: c.menus?.length ? c.menus : DEMO_CMS.menus,
        homeSections: c.homeSections?.length ? c.homeSections : DEMO_CMS.homeSections,
        faqs: c.faqs?.length ? c.faqs : DEMO_CMS.faqs,
      }),
      error: () => this.cms.set(DEMO_CMS),
    });
    this.http.get<Category[]>('/api/v1/public/categories').subscribe({
      next: rows => { if (rows?.length) this.categories.set(rows.filter(c => !c.parentId)); },
      error: () => this.categories.set(DEMO_CATEGORIES),
    });
  }

  logo() { return this.settings().logoUrl || 'assets/logo-dibidani.png'; }
  pages(): SiteBlock[] { return this.cms().pages || []; }

  socials(): SiteBlock[] {
    const rows = (this.cms().socials || []).filter(x => x.active !== false && !!x.linkUrl);
    if (rows.length) return rows;
    const s = this.settings();
    return ([
      {kind: 'SOCIAL' as const, slug: 'whatsapp', title: 'WhatsApp', linkUrl: s.whatsappUrl},
      {kind: 'SOCIAL' as const, slug: 'facebook', title: 'Facebook', linkUrl: s.facebookUrl},
      {kind: 'SOCIAL' as const, slug: 'instagram', title: 'Instagram', linkUrl: s.instagramUrl},
      {kind: 'SOCIAL' as const, slug: 'tiktok', title: 'TikTok', linkUrl: s.tiktokUrl},
      {kind: 'SOCIAL' as const, slug: 'youtube', title: 'YouTube', linkUrl: s.youtubeUrl},
      {kind: 'SOCIAL' as const, slug: 'linkedin', title: 'LinkedIn', linkUrl: s.linkedinUrl},
    ] as SiteBlock[]).filter(x => !!x.linkUrl);
  }

  menu(location: string): SiteBlock[] {
    return (this.cms().menus || []).filter(m => m.slug === location && m.active !== false);
  }

  homeOn(slug: string): boolean {
    const rows = this.cms().homeSections || [];
    if (!rows.length) return true;
    return rows.some(x => x.slug === slug && x.active !== false);
  }

  homeItems(slug: string): SiteBlock[] {
    return (this.cms().homeSections || []).filter(x => x.slug === slug && x.active !== false);
  }

  homeSection(slug: string): SiteBlock | undefined {
    return (this.cms().homeSections || []).find(x => x.slug === slug && x.active !== false);
  }

  homeTitle(slug: string, fallback: string): string {
    return this.homeSection(slug)?.title || fallback;
  }

  homeSubtitle(slug: string, fallback: string): string {
    return this.homeSection(slug)?.subtitle || fallback;
  }

  homeCta(slug: string, fallback: string): string {
    return this.homeSection(slug)?.ctaLabel || fallback;
  }

  homeLink(slug: string, fallback = '/category/all'): string {
    return this.homeSection(slug)?.linkUrl || fallback;
  }

  isExternal(url?: string | null): boolean {
    return !!url && /^https?:\/\//.test(url);
  }

  faqs(pageSlug = 'faq'): SiteBlock[] {
    return (this.cms().faqs || []).filter(x => x.active !== false && (x.slug || 'faq') === pageSlug);
  }
}
