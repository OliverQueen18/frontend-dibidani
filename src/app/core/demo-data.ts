import {Advertisement, Category, HomeData, Product, ShopSettings} from './models';

const cat = (id: number, name: string, slug: string, icon: string): Category => ({id, name, slug, icon});

export const DEMO_CATEGORIES: Category[] = [
  cat(1, 'Pièces détachées', 'pieces-detachees', '⚙️'),
  cat(2, 'Quincaillerie', 'quincaillerie', '🛠️'),
  cat(3, 'Alimentation', 'alimentation', '🛒'),
  cat(4, 'Boissons & Eaux', 'boissons-eaux', '🥤'),
  cat(5, 'Vêtements', 'vetements', '👕'),
  cat(6, 'Électronique', 'electronique', '📱'),
  cat(7, 'Électroménager', 'electromenager', '🧺'),
  cat(8, 'Maison', 'maison', '🏠'),
  cat(9, 'Énergie solaire', 'energie-solaire', '☀️'),
];

const bySlug = (slug: string) => DEMO_CATEGORIES.find(c => c.slug === slug)!;

function p(partial: Omit<Product, 'unit' | 'featured' | 'bestSeller' | 'rating' | 'reviewCount' | 'mainImageUrl'> & Partial<Product>): Product {
  return {
    unit: 'unité',
    featured: true,
    bestSeller: true,
    rating: 4.5,
    reviewCount: 24,
    mainImageUrl: 'assets/product-placeholder.svg',
    ...partial,
  };
}

export const DEMO_PRODUCTS: Product[] = [
  p({id: 1, sku: 'DBD-EL-001', name: 'Samsung Galaxy A54 5G', slug: 'samsung-galaxy-a54-5g', price: 180000, promoPrice: 165000, stock: 25, category: bySlug('electronique'), brand: {id: 1, name: 'Samsung'}, vendor: {id: 1, name: 'Electro Mali', slug: 'electro-mali', district: 'Hamdallaye'}, shortDescription: 'Smartphone 5G livré à Bamako.'}),
  p({id: 2, sku: 'DBD-QC-001', name: 'Perceuse Bosch 750W', slug: 'perceuse-bosch-750w', price: 75000, promoPrice: 65000, stock: 30, category: bySlug('quincaillerie'), brand: {id: 2, name: 'Bosch'}, vendor: {id: 2, name: 'Quincaillerie Dibidani', slug: 'quincaillerie-dibidani', district: 'Dibidani'}}),
  p({id: 3, sku: 'DBD-AL-001', name: 'Riz local 50 kg', slug: 'riz-local-50kg', price: 25000, promoPrice: 23000, stock: 35, category: bySlug('alimentation'), vendor: {id: 3, name: 'Dibidani Distribution', slug: 'dibidani-distribution', district: 'Commune III'}}),
  p({id: 4, sku: 'DBD-BV-001', name: 'Eau minérale pack 6', slug: 'eau-minerale-pack-6', price: 4000, promoPrice: 3500, stock: 40, category: bySlug('boissons-eaux'), vendor: {id: 3, name: 'Dibidani Distribution', slug: 'dibidani-distribution', district: 'Commune III'}}),
  p({id: 5, sku: 'DBD-PD-001', name: 'Huile moteur Total 5W40', slug: 'huile-moteur-total-5w40', price: 28000, promoPrice: 25000, stock: 45, category: bySlug('pieces-detachees'), brand: {id: 3, name: 'TotalEnergies'}, vendor: {id: 4, name: 'Auto Pièces Dibidani', slug: 'auto-pieces-dibidani', district: 'Medina Coura'}}),
  p({id: 6, sku: 'DBD-EN-001', name: 'Kit solaire domestique 1000W', slug: 'kit-solaire-1000w', price: 275000, promoPrice: 250000, stock: 50, category: bySlug('energie-solaire'), vendor: {id: 5, name: 'Olive Services', slug: 'olive-services', district: 'ACI 2000'}}),
  p({id: 7, sku: 'DBD-PD-002', name: 'Batterie 70 Ah', slug: 'batterie-70ah-varta', price: 85000, promoPrice: 79000, stock: 18, category: bySlug('pieces-detachees'), brand: {id: 4, name: 'Varta'}, vendor: {id: 4, name: 'Auto Pièces Dibidani', slug: 'auto-pieces-dibidani', district: 'Medina Coura'}}),
  p({id: 8, sku: 'DBD-EM-001', name: 'Ventilateur sur pied 16"', slug: 'ventilateur-sur-pied-16', price: 22000, promoPrice: 19500, stock: 20, category: bySlug('electromenager'), vendor: {id: 1, name: 'Electro Mali', slug: 'electro-mali', district: 'Hamdallaye'}, bestSeller: true}),
];

const ad = (title: string, description: string, targetUrl: string, ctaLabel: string, imageUrl?: string): Advertisement =>
  ({title, description, targetUrl, ctaLabel, imageUrl});

export const DEMO_SETTINGS: ShopSettings = {
  name: 'Dibidani',
  slogan: 'Le marché qui vient à vous',
  phone: '+223 76 12 34 56',
  whatsapp: '+223 76 12 34 56',
  whatsappUrl: 'https://wa.me/22376123456',
  email: 'contact@dibidani.ml',
  address: 'Marché de Dibidani, Commune III',
  city: 'Bamako',
  facebookUrl: 'https://www.facebook.com/dibidani',
  tiktokUrl: 'https://www.tiktok.com/@dibidani',
};

export const DEMO_HOME: HomeData = {
  categories: DEMO_CATEGORIES,
  promotions: DEMO_PRODUCTS.filter(x => x.promoPrice),
  popular: DEMO_PRODUCTS.filter(x => x.bestSeller),
  featured: DEMO_PRODUCTS.filter(x => x.featured),
  bestSellers: DEMO_PRODUCTS.filter(x => x.bestSeller),
  heroAds: [
    ad('Le grand marché de Bamako, à portée de main', 'Commandez vos produits du marché en ligne et recevez-les facilement chez vous, au bureau ou partout à Bamako.', '/category/all', 'Découvrir nos offres', 'assets/hero-market.jpg'),
    ad('Pièces auto et moto au meilleur prix', 'Batteries, huiles et filtres des meilleures marques, livrés en 24 h à Bamako.', '/category/pieces-detachees', 'Voir les pièces', 'assets/hero-market.jpg'),
    ad('Passez à l\'énergie solaire', 'Kits solaires et équipements électriques pour la maison et le commerce.', '/category/energie-solaire', 'Je m\'équipe', 'assets/hero-market.jpg'),
  ],
  topAds: [ad('Votre publicité ici', 'Touchez des milliers de clients chaque jour', '/category/all', 'En savoir plus')],
  middleAds: [ad('Panneaux solaires pour un Mali plus lumineux', 'Installation, garantie et livraison à Bamako.', '/category/energie-solaire', 'Découvrir')],
  bottomAds: [ad('Des marques fiables, disponibles à Dibidani', 'Samsung, Bosch, Varta, TotalEnergies et bien d\'autres.', '/category/all', 'Voir les offres')],
};

export function demoProduct(slug: string) { return DEMO_PRODUCTS.find(x => x.slug === slug); }
export function demoProductsFor(categorySlug: string) {
  if (!categorySlug || categorySlug === 'all') return DEMO_PRODUCTS;
  return DEMO_PRODUCTS.filter(x => x.category.slug === categorySlug);
}
