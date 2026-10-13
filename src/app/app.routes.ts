import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { CategoryComponent } from './pages/category.component';
import { ProductComponent } from './pages/product.component';
import { CartComponent } from './pages/cart.component';
import { CheckoutComponent } from './pages/checkout.component';
import { ConfirmationComponent } from './pages/confirmation.component';
import { TrackComponent } from './pages/track.component';
import { LoginComponent } from './pages/login.component';
import { AccountComponent } from './pages/account.component';
import { AdminLayoutComponent } from './pages/admin-layout.component';
import { AdminComponent } from './pages/admin.component';
import { AdminStockComponent } from './pages/admin-stock.component';
import { AdminCmsComponent } from './pages/admin-cms.component';
import { AdminProductsComponent } from './pages/admin-products.component';
import { AdminCategoriesComponent } from './pages/admin-categories.component';
import { AdminBrandsComponent } from './pages/admin-brands.component';
import { AdminVendorsComponent } from './pages/admin-vendors.component';
import { AdminCustomersComponent } from './pages/admin-customers.component';
import { AdminOrdersComponent } from './pages/admin-orders.component';
import { AdminPaymentsComponent } from './pages/admin-payments.component';
import { AdminDeliveriesComponent } from './pages/admin-deliveries.component';
import { AdminAdsComponent } from './pages/admin-ads.component';
import { AdminPromosComponent } from './pages/admin-promos.component';
import { AdminZonesComponent } from './pages/admin-zones.component';
import { AdminUsersComponent } from './pages/admin-users.component';
import { AdminSettingsComponent } from './pages/admin-settings.component';
import { AdminReportsComponent } from './pages/admin-reports.component';
import { CmsPageComponent } from './pages/cms-page.component';
import { authGuard, staffGuard, permissionGuard } from './core/auth.guards';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'category/:slug', component: CategoryComponent },
  { path: 'product/:slug', component: ProductComponent },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'confirmation/:number', component: ConfirmationComponent, canActivate: [authGuard] },
  { path: 'track', component: TrackComponent },
  { path: 'track/:number', component: TrackComponent },
  { path: 'p/:slug', component: CmsPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'account', component: AccountComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [staffGuard],
    children: [
      { path: '', component: AdminComponent },
      { path: 'contenu', component: AdminCmsComponent, canActivate: [permissionGuard('SETTINGS_MANAGE', 'ADS_MANAGE')] },
      { path: 'produits', component: AdminProductsComponent, canActivate: [permissionGuard('CATALOG_VIEW', 'CATALOG_MANAGE')] },
      { path: 'categories', component: AdminCategoriesComponent, canActivate: [permissionGuard('CATALOG_VIEW', 'CATALOG_MANAGE')] },
      { path: 'marques', component: AdminBrandsComponent, canActivate: [permissionGuard('CATALOG_VIEW', 'CATALOG_MANAGE')] },
      { path: 'vendeurs', component: AdminVendorsComponent, canActivate: [permissionGuard('CATALOG_VIEW', 'CATALOG_MANAGE')] },
      { path: 'stocks', component: AdminStockComponent, canActivate: [permissionGuard('STOCK_VIEW', 'STOCK_MANAGE')] },
      { path: 'commandes', component: AdminOrdersComponent, canActivate: [permissionGuard('ORDERS_MANAGE')] },
      { path: 'clients', component: AdminCustomersComponent, canActivate: [permissionGuard('CUSTOMERS_VIEW', 'CUSTOMERS_MANAGE')] },
      { path: 'paiements', component: AdminPaymentsComponent, canActivate: [permissionGuard('PAYMENTS_MANAGE')] },
      { path: 'livraisons', component: AdminDeliveriesComponent, canActivate: [permissionGuard('DELIVERIES_MANAGE')] },
      { path: 'zones', component: AdminZonesComponent, canActivate: [permissionGuard('DELIVERIES_MANAGE')] },
      { path: 'publicites', component: AdminAdsComponent, canActivate: [permissionGuard('ADS_MANAGE')] },
      { path: 'promos', component: AdminPromosComponent, canActivate: [permissionGuard('PROMOTIONS_MANAGE')] },
      { path: 'statistiques', component: AdminReportsComponent, canActivate: [permissionGuard('REPORTS_VIEW')] },
      { path: 'utilisateurs', component: AdminUsersComponent, canActivate: [permissionGuard('USERS_MANAGE')] },
      { path: 'parametres', component: AdminSettingsComponent, canActivate: [permissionGuard('SETTINGS_MANAGE')] },
    ]
  },
  { path: '**', redirectTo: '' }
];
