import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timeout } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Product } from './models';
import { DEMO_PRODUCTS } from './demo-data';

export interface AssistantAction {
  type: string;
  productId?: number | null;
  quantity?: number | null;
  path?: string | null;
}

export interface AssistantReply {
  reply: string;
  intent: string;
  query: string;
  products: Product[];
  suggestions: string[];
  action?: AssistantAction | null;
}

@Injectable({ providedIn: 'root' })
export class AssistantService {
  constructor(private http: HttpClient) {}

  chat(message: string, cartCount: number, lastProductIds: number[]): Observable<AssistantReply> {
    const local = this.local(message, cartCount, lastProductIds);
    if (local.intent !== 'SEARCH') return of(local);
    return this.http.post<AssistantReply>('/api/v1/public/assistant/chat', { message, cartCount, lastProductIds }).pipe(
      timeout(2500),
      map(r => ({
        ...r,
        products: (r.products || []).map(asProduct),
        suggestions: r.suggestions || [],
      })),
      catchError(() => of(local))
    );
  }

  local(message: string, cartCount: number, lastProductIds: number[]): AssistantReply {
    const n = fold(message);
    const last = lastProductIds.map(id => DEMO_PRODUCTS.find(p => p.id === id)).filter((p): p is Product => !!p);
    const chips = ['Je cherche une perceuse', 'Riz 50 kg', 'Voir le panier', 'Passer commande'];

    if (/bonjour|salut|hello|bonsoir|i ni ce/.test(n) && n.split(/\s+/).length <= 4) {
      return { reply: 'Bonjour, je suis l\'assistant Dibidani. Dites un produit à l\'écrit ou au micro : je cherche, j\'ajoute au panier et je vous emmène jusqu\'à la commande.', intent: 'GREETING', query: '', products: DEMO_PRODUCTS.slice(0, 4), suggestions: chips };
    }
    if (/aide|comment|livraison/.test(n)) {
      return { reply: 'Je cherche un produit (écrit ou vocal), je l\'ajoute au panier et je vous conduis à la commande. Après votre commande, Dibidani vérifie la disponibilité auprès des vendeurs puis vous confirme. Livraison à Bamako à partir de 2 500 FCFA.', intent: 'HELP', query: '', products: [], suggestions: chips };
    }
    if (/suivi|suivre|tracking/.test(n)) {
      return { reply: 'Je vous ouvre le suivi de commande.', intent: 'TRACK', query: '', products: [], suggestions: chips, action: { type: 'NAVIGATE', path: '/track' } };
    }
    const adding = /ajout|mets dans|je prend|au panier/.test(n);
    if (adding) {
      const pick = pickLocal(n, last) || searchLocal(hint(n))[0];
      if (!pick) return { reply: 'Quel produit dois-je ajouter ? Dites son nom, ou « ajoute le premier » après une recherche.', intent: 'ADD_CART', query: '', products: last, suggestions: chips };
      return { reply: `« ${pick.name} » est dans le panier. Dites « commande » quand vous êtes prêt.`, intent: 'ADD_CART', query: '', products: last.length ? last : [pick], suggestions: ['Passer commande', 'Voir le panier'], action: { type: 'ADD_TO_CART', productId: pick.id, quantity: qty(n) } };
    }
    if (/panier/.test(n)) {
      if (cartCount <= 0) return { reply: 'Votre panier est vide. Quel produit cherchez-vous ?', intent: 'CART', query: '', products: [], suggestions: chips };
      return { reply: `Vous avez ${cartCount} article(s). Je vous ouvre le panier.`, intent: 'CART', query: '', products: [], suggestions: ['Passer commande'], action: { type: 'NAVIGATE', path: '/cart' } };
    }
    const q = hint(n);
    if (/passer commande|command|payer|paiement/.test(n) && (!q || q === 'passer')) {
      if (cartCount <= 0) return { reply: 'Votre panier est vide. Dites-moi ce que vous voulez commander.', intent: 'CHECKOUT', query: '', products: [], suggestions: chips };
      return { reply: 'Je vous emmène à l\'étape de commande.', intent: 'CHECKOUT', query: '', products: [], suggestions: ['Voir le panier'], action: { type: 'NAVIGATE', path: '/checkout' } };
    }
    if (!q) return { reply: 'Dites-moi un produit, par exemple « perceuse Bosch » ou « riz 50 kg ».', intent: 'GREETING', query: '', products: DEMO_PRODUCTS.slice(0, 4), suggestions: chips };
    const found = searchLocal(q);
    if (!found.length) return { reply: `Je n'ai pas trouvé « ${q} ». Essayez un autre mot.`, intent: 'SEARCH', query: q, products: [], suggestions: chips };
    return { reply: `Voici ce que j'ai pour « ${q} ». Dites « ajoute le premier » ou touchez un produit, puis « commande ».`, intent: 'SEARCH', query: q, products: found, suggestions: ['Ajoute le premier', 'Passer commande'] };
  }
}

export function asProduct(s: any): Product {
  return {
    id: s.id,
    sku: s.sku,
    name: s.name,
    slug: s.slug,
    shortDescription: s.shortDescription,
    price: Number(s.price),
    promoPrice: s.promoPrice != null ? Number(s.promoPrice) : undefined,
    stock: s.stock ?? 0,
    unit: s.unit || 'unité',
    mainImageUrl: s.mainImageUrl,
    category: s.category || { id: 0, name: '', slug: '' },
    brand: s.brand,
    vendor: s.vendor,
    featured: !!s.featured,
    bestSeller: !!s.bestSeller,
    rating: s.rating ?? 0,
    reviewCount: s.reviewCount ?? 0,
  };
}

function searchLocal(q: string): Product[] {
  const t = fold(q);
  if (!t) return [];
  return DEMO_PRODUCTS.filter(p => fold(p.name + ' ' + (p.category?.name || '') + ' ' + (p.brand?.name || '')).includes(t)
    || t.split(/\s+/).some(w => w.length > 2 && fold(p.name).includes(w))).slice(0, 6);
}

function pickLocal(n: string, last: Product[]): Product | undefined {
  if (!last.length) return undefined;
  if (/premier|1er/.test(n)) return last[0];
  if (/deuxieme|2e|second/.test(n)) return last[1] || last[0];
  if (/troisieme|3e/.test(n)) return last[2] || last[0];
  const q = hint(n);
  return last.find(p => fold(p.name).includes(q)) || (last.length === 1 ? last[0] : undefined);
}

function qty(n: string): number {
  if (/\b(deux|2)\b/.test(n)) return 2;
  if (/\b(trois|3)\b/.test(n)) return 3;
  const m = n.match(/\b(\d{1,2})\b/);
  return m ? Math.max(1, Number(m[1])) : 1;
}

function hint(n: string): string {
  return n.replace(/\b(ajoute|ajouter|mets|met|prendre|prends|prend|le premier|au panier|panier|commande|commander|passer|payer|je cherche|cherche moi|je veux|je voudrais|montre moi|trouve moi|besoin de|un|une|le|la|les|de|du|des|moi)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function fold(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/['’]/g, ' ').replace(/\s+/g, ' ').trim();
}
