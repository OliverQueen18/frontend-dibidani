export interface Category {id:number;name:string;slug:string;icon?:string;imageUrl?:string;parentId?:number|null;children?:Category[];}
export interface Vendor {id:number;name:string;slug?:string;district?:string;phone?:string;whatsapp?:string;logoUrl?:string;productCount?:number;city?:string;description?:string;address?:string;}
export interface Brand {id:number;name:string;logoUrl?:string;}
export interface ProductSpec {label:string;value:string;}
export interface Product {id:number;sku:string;barcode?:string;name:string;slug:string;shortDescription?:string;description?:string;price:number;promoPrice?:number;stock:number;unit:string;mainImageUrl?:string;images?:string[];specifications?:ProductSpec[];category:Category;brand?:Brand;vendor?:Vendor;featured:boolean;bestSeller:boolean;rating:number;reviewCount:number;}
export function productGallery(p: {mainImageUrl?: string | null; images?: string[] | null}): string[] {
  const out: string[] = [];
  const add = (u?: string | null) => { if (u && !out.includes(u)) out.push(u); };
  add(p.mainImageUrl);
  (p.images || []).forEach(add);
  return out;
}
export interface Advertisement {id?:number;title:string;subtitle?:string;description?:string;imageUrl?:string;targetUrl?:string;ctaLabel?:string;placement?:string;position?:string;external?:boolean;}
export interface HomeData {categories:Category[];featured?:Product[];bestSellers?:Product[];promotions?:Product[];popular?:Product[];heroAds:Advertisement[];homeAds?:Advertisement[];topAds?:Advertisement[];middleAds?:Advertisement[];bottomAds?:Advertisement[];}
export interface ShopSettings {
  name?:string;slogan?:string;phone?:string;whatsapp?:string;whatsappUrl?:string;email?:string;address?:string;city?:string;
  openingHours?:string;deliveryFee?:number;freeDeliveryThreshold?:number;pickupAddress?:string;pickupHours?:string;bankTransferDetails?:string;
  facebookUrl?:string;instagramUrl?:string;tiktokUrl?:string;youtubeUrl?:string;linkedinUrl?:string;logoUrl?:string;topbarText?:string;heroLocation?:string;heroLocationSub?:string;
  floatingBanner?:string;navPromoLabel?:string;footerAbout?:string;footerCopyright?:string;
  testimonialsTitle?:string;testimonialsSubtitle?:string;partnersTitle?:string;partnersSubtitle?:string;
}
export type SiteBlockKind = 'HERO'|'TESTIMONIAL'|'PARTNER'|'PAGE'|'SOCIAL'|'MENU'|'HOME'|'FAQ';
export interface SiteBlock {
  id?:number;kind:SiteBlockKind;slug?:string|null;title:string;subtitle?:string|null;body?:string|null;
  imageUrl?:string|null;linkUrl?:string|null;ctaLabel?:string|null;meta?:string|null;displayOrder?:number;active?:boolean;
}
export interface CmsContent {
  appearance:Record<string,string|null>;
  heroes:SiteBlock[];
  testimonials:SiteBlock[];
  partners:SiteBlock[];
  pages:SiteBlock[];
  socials?:SiteBlock[];
  menus?:SiteBlock[];
  homeSections?:SiteBlock[];
  faqs?:SiteBlock[];
}
export type SocialChannel = 'FACEBOOK'|'TIKTOK'|'WHATSAPP';
export interface ProductShare {caption:string;productUrl:string;whatsappUrl:string;facebookUrl:string;tiktokUrl:string;orderWhatsappUrl:string;}
export interface SocialPost {id:number;productId:number;productName:string;channel:SocialChannel;channelLabel:string;status:string;message:string;productUrl?:string;shareUrl?:string;externalId?:string;errorMessage?:string;mock:boolean;publishedAt?:string;}
export interface CartItem {product:Product;quantity:number;}
export interface Order {id:number;orderNumber:string;status:string;subtotal:number;deliveryFee:number;total:number;deliveryAddress:string;paymentMethod:string;trackingCode:string;items:any[];createdAt:string;}
