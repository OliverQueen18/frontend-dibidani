import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { prepareImageUpload } from './image-upload';
import { HomeData, Product, Category, Order, ShopSettings, ProductShare, SocialChannel, SocialPost, CmsContent, SiteBlock } from './models';

@Injectable({providedIn: 'root'})
export class ApiService {
  private base = '/api/v1';
  constructor(private http: HttpClient) {}

  home(): Observable<HomeData> { return this.http.get<HomeData>(`${this.base}/public/home`); }
  settings(): Observable<ShopSettings> { return this.http.get<ShopSettings>(`${this.base}/public/settings`); }
  cms(): Observable<CmsContent> { return this.http.get<CmsContent>(`${this.base}/public/cms`); }
  cmsPage(slug: string) { return this.http.get<SiteBlock>(`${this.base}/public/cms/pages/${slug}`); }
  products(qOrParams: string | Record<string, string | number | boolean> = '', category = ''): Observable<any> {
    const params = typeof qOrParams === 'string' ? {q: qOrParams, category} : qOrParams;
    return this.http.get(`${this.base}/public/products`, {params: this.params(params)});
  }
  product(slug: string) { return this.http.get<Product>(`${this.base}/public/products/${slug}`); }
  productShare(slug: string) { return this.http.get<ProductShare>(`${this.base}/public/products/${slug}/share`); }
  categories() { return this.http.get<Category[]>(`${this.base}/public/categories`); }
  vendors() { return this.http.get<any[]>(`${this.base}/public/vendors`); }
  brands() { return this.http.get<any[]>(`${this.base}/public/brands`); }
  login(body: any) { return this.http.post<any>(`${this.base}/auth/login`, body); }
  register(body: any) { return this.http.post<any>(`${this.base}/auth/register`, body); }
  createOrder(body: any) { return this.http.post<Order>(`${this.base}/orders`, body); }
  payOrder(n: string, body: any) { return this.http.post<Order>(`${this.base}/orders/${n}/pay`, body); }
  orders() { return this.http.get<Order[]>(`${this.base}/orders`); }
  order(n: string) { return this.http.get<Order>(`${this.base}/orders/${n}`); }

  accountDashboard() { return this.http.get<any>(`${this.base}/account/dashboard`); }
  accountProfile() { return this.http.get<any>(`${this.base}/account/profile`); }
  updateProfile(body: {fullName: string; phone: string}) { return this.http.put<any>(`${this.base}/account/profile`, body); }
  changePassword(body: {currentPassword: string; newPassword: string}) {
    return this.http.put(`${this.base}/account/password`, body, {responseType: 'text'});
  }
  addresses() { return this.http.get<any[]>(`${this.base}/account/addresses`); }
  saveAddress(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/account/addresses/${id}`, body) : this.http.post<any>(`${this.base}/account/addresses`, body);
  }
  setDefaultAddress(id: number) { return this.http.post<any>(`${this.base}/account/addresses/${id}/default`, {}); }
  deleteAddress(id: number) { return this.http.delete(`${this.base}/account/addresses/${id}`); }
  favorites() { return this.http.get<any[]>(`${this.base}/account/favorites`); }
  removeFavorite(productId: number) { return this.http.delete<number[]>(`${this.base}/account/favorites/${productId}`); }
  publicZones() { return this.http.get<any[]>(`${this.base}/public/delivery-zones`); }

  sellerDashboard() { return this.http.get<any>(`${this.base}/seller/dashboard`); }
  sellerProducts(q = '', page = 0) { return this.http.get<any>(`${this.base}/seller/products`, {params: {q, page, size: 50}}); }
  sellerProduct(id: number) { return this.http.get<any>(`${this.base}/seller/products/${id}`); }
  saveSellerProduct(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/seller/products/${id}`, body) : this.http.post<any>(`${this.base}/seller/products`, body);
  }
  setSellerProductActive(id: number, active: boolean) {
    return this.http.post<any>(`${this.base}/seller/products/${id}/active`, {}, {params: {active}});
  }
  duplicateSellerProduct(id: number) { return this.http.post<any>(`${this.base}/seller/products/${id}/duplicate`, {}); }
  sellerOrders() { return this.http.get<any[]>(`${this.base}/seller/orders`); }

  dashboard(from?: string, to?: string, all = false) { return this.http.get<any>(`${this.base}/admin/dashboard`, {params: this.params({from, to, all: all || undefined})}); }
  reports(from?: string, to?: string, all = false) { return this.http.get<any>(`${this.base}/admin/reports`, {params: this.params({from, to, all: all || undefined})}); }
  exportReport(from?: string, to?: string, all = false) { return this.http.get(`${this.base}/admin/reports/export.csv`, {params: this.params({from, to, all: all || undefined}), responseType: 'blob'}); }
  adminProducts(filters: Record<string, string | number | boolean | undefined> = {}, page = 0, size = 20) {
    return this.http.get<any>(`${this.base}/admin/products`, {params: this.params({...filters, page, size})});
  }
  adminProduct(id: number) { return this.http.get<any>(`${this.base}/admin/products/${id}`); }
  saveProduct(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/admin/products/${id}`, body) : this.http.post<any>(`${this.base}/admin/products`, body);
  }
  duplicateProduct(id: number) { return this.http.post<any>(`${this.base}/admin/products/${id}/duplicate`, {}); }
  setProductActive(id: number, active: boolean) {
    return this.http.post<any>(`${this.base}/admin/products/${id}/active`, {}, {params: {active}});
  }
  deleteProduct(id: number) { return this.http.delete<any>(`${this.base}/admin/products/${id}`); }
  adminCategories() { return this.http.get<any[]>(`${this.base}/admin/categories`); }
  saveCategory(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/admin/categories/${id}`, body) : this.http.post<any>(`${this.base}/admin/categories`, body);
  }
  deleteCategory(id: number) { return this.http.delete<any>(`${this.base}/admin/categories/${id}`); }
  adminBrands() { return this.http.get<any[]>(`${this.base}/admin/brands`); }
  saveBrand(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/admin/brands/${id}`, body) : this.http.post<any>(`${this.base}/admin/brands`, body);
  }
  deleteBrand(id: number) { return this.http.delete<any>(`${this.base}/admin/brands/${id}`); }
  adminUnits() { return this.http.get<any[]>(`${this.base}/admin/units`); }
  saveUnit(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/admin/units/${id}`, body) : this.http.post<any>(`${this.base}/admin/units`, body);
  }
  adminVendors() { return this.http.get<any>(`${this.base}/admin/vendors`); }
  saveVendor(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/admin/vendors/${id}`, body) : this.http.post<any>(`${this.base}/admin/vendors`, body);
  }
  deleteVendor(id: number) { return this.http.delete<any>(`${this.base}/admin/vendors/${id}`); }
  adminOrders(params: Record<string, string | number> = {}) { return this.http.get<any>(`${this.base}/admin/orders`, {params: this.params(params)}); }
  adminOrder(id: number) { return this.http.get<any>(`${this.base}/admin/orders/${id}`); }
  orderStatuses() { return this.http.get<any[]>(`${this.base}/admin/orders/statuses`); }
  orderCounts() { return this.http.get<Record<string, number>>(`${this.base}/admin/orders/counts`); }
  changeOrderStatus(id: number, status: string, comment?: string) {
    return this.http.post<any>(`${this.base}/admin/orders/${id}/status`, {status, comment});
  }
  orderNote(id: number, note: string) { return this.http.put<any>(`${this.base}/admin/orders/${id}/note`, {note}); }
  markPaid(id: number, reference?: string) { return this.http.post<any>(`${this.base}/admin/orders/${id}/mark-paid`, {reference}); }
  assignDelivery(id: number, body: any) { return this.http.post<any>(`${this.base}/admin/orders/${id}/delivery`, body); }
  adminAds() { return this.http.get<any>(`${this.base}/admin/ads`); }
  saveAd(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/admin/advertisements/${id}`, body) : this.http.post<any>(`${this.base}/admin/advertisements`, body);
  }
  deleteAd(id: number) { return this.http.delete(`${this.base}/admin/advertisements/${id}`); }
  customers(q = '', page = 0) { return this.http.get<any>(`${this.base}/admin/customers`, {params: {q, page, size: 30}}); }
  customer(id: number) { return this.http.get<any>(`${this.base}/admin/customers/${id}`); }
  setCustomerActive(id: number, active: boolean) { return this.http.post<any>(`${this.base}/admin/customers/${id}/active`, {}, {params: {active}}); }
  users(q = '', page = 0) { return this.http.get<any>(`${this.base}/admin/users`, {params: {q, page, size: 30}}); }
  roles() { return this.http.get<any[]>(`${this.base}/admin/roles`); }
  saveUser(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/admin/users/${id}`, body) : this.http.post<any>(`${this.base}/admin/users`, body);
  }
  shopSettings() { return this.http.get<Record<string, string>>(`${this.base}/admin/settings`); }
  saveShopSettings(changes: Record<string, string | null>) { return this.http.put<Record<string, string>>(`${this.base}/admin/settings`, changes); }
  adminCms() { return this.http.get<CmsContent>(`${this.base}/admin/cms`); }
  saveCmsBlock(body: any, id?: number) {
    return id ? this.http.put<SiteBlock>(`${this.base}/admin/cms/blocks/${id}`, body) : this.http.post<SiteBlock>(`${this.base}/admin/cms/blocks`, body);
  }
  deleteCmsBlock(id: number) { return this.http.delete(`${this.base}/admin/cms/blocks/${id}`); }
  payments(page = 0) { return this.http.get<any>(`${this.base}/admin/payments`, {params: {page, size: 30}}); }
  paymentStats() { return this.http.get<any[]>(`${this.base}/admin/payments/stats`); }
  deliveries(page = 0) { return this.http.get<any>(`${this.base}/admin/deliveries`, {params: {page, size: 30}}); }
  couriers() { return this.http.get<any[]>(`${this.base}/admin/couriers`); }
  promoCodes() { return this.http.get<any[]>(`${this.base}/admin/promo-codes`); }
  savePromo(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/admin/promo-codes/${id}`, body) : this.http.post<any>(`${this.base}/admin/promo-codes`, body);
  }
  deletePromo(id: number) { return this.http.delete<any>(`${this.base}/admin/promo-codes/${id}`); }
  deliveryZones() { return this.http.get<any[]>(`${this.base}/admin/delivery-zones`); }
  saveZone(body: any, id?: number) {
    return id ? this.http.put<any>(`${this.base}/admin/delivery-zones/${id}`, body) : this.http.post<any>(`${this.base}/admin/delivery-zones`, body);
  }
  deleteZone(id: number) { return this.http.delete<any>(`${this.base}/admin/delivery-zones/${id}`); }
  upload(file: File) {
    return from(prepareImageUpload(file)).pipe(
      switchMap(prepared => {
        const fd = new FormData();
        fd.append('file', prepared);
        return this.http.post<{url: string}>(`${this.base}/admin/uploads`, fd);
      })
    );
  }
  mediaLibrary() {
    return this.http.get<{url: string; name: string; bytes: number; modified: string}[]>(`${this.base}/admin/uploads`);
  }
  deleteMedia(url: string) {
    return this.http.delete(`${this.base}/admin/uploads`, {params: {url}});
  }
  studioUpload(file: File, productId?: number) {
    const fd = new FormData();
    fd.append('file', file);
    if (productId) fd.append('productId', String(productId));
    return this.http.post<any>(`${this.base}/products/images/upload`, fd);
  }
  studioProcess(body: any) { return this.http.post<any>(`${this.base}/products/images/process`, body); }
  studioJob(id: number) { return this.http.get<any>(`${this.base}/products/images/jobs/${id}`); }
  studioConfirm(id: number, body: any) { return this.http.post<any>(`${this.base}/products/images/${id}/confirm`, body); }
  studioImages(productId: number) { return this.http.get<any[]>(`${this.base}/products/${productId}/images`); }
  setProductVitrine(productId: number, imageUrl: string) {
    return this.http.post<{mainImageUrl: string; images: string[]}>(`${this.base}/products/${productId}/vitrine`, {imageUrl});
  }
  studioDelete(id: number) { return this.http.delete(`${this.base}/products/images/${id}`); }
  studioLookup(code: string) { return this.http.get<any>(`${this.base}/products/images/lookup`, {params: {code}}); }
  photoStudioSettings() { return this.http.get<any>(`${this.base}/admin/photo-studio/settings`); }
  savePhotoStudioSettings(body: any) { return this.http.put<any>(`${this.base}/admin/photo-studio/settings`, body); }
  publishProduct(id: number, channels: SocialChannel[], message?: string) {
    return this.http.post<SocialPost[]>(`${this.base}/admin/products/${id}/social-publish`, {channels, message});
  }
  socialPosts(id: number) { return this.http.get<SocialPost[]>(`${this.base}/admin/products/${id}/social-posts`); }

  private params(obj: Record<string, string | number | boolean | null | undefined>) {
    let p = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return p;
  }
}
