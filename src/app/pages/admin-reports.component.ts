import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ApiService} from '../core/api.service';
import {PeriodRange} from '../core/period';
import {PeriodFilterComponent} from '../shared/period-filter.component';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule, PeriodFilterComponent],
  template: `
<div class="page">
  <header>
    <div><h1>Statistiques</h1><p>Ventes, catégories, vendeurs et meilleurs produits.</p></div>
    <button class="btn" type="button" (click)="exportCsv()">Exporter CSV</button>
  </header>
  <app-period-filter (periodChange)="onPeriod($event)"></app-period-filter>
  <div class="kpis" *ngIf="report">
    <div><small>Chiffre d'affaires</small><b>{{report.revenue | number:'1.0-0'}} FCFA</b></div>
    <div><small>Commandes</small><b>{{report.orders}}</b></div>
    <div><small>Panier moyen</small><b>{{report.averageBasket | number:'1.0-0'}} FCFA</b></div>
    <div><small>Nouveaux clients</small><b>{{report.newCustomers}}</b></div>
  </div>
  <div class="kpis secondary" *ngIf="report">
    <div><small>Articles vendus</small><b>{{report.unitsSold || 0}}</b></div>
  </div>
  <h2 *ngIf="report">Meilleurs produits</h2>
  <table *ngIf="report">
    <tr><th>Produit</th><th>SKU</th><th>Qté</th><th>CA</th></tr>
    <tr *ngFor="let p of report.topProducts">
      <td>{{p.name}}</td><td>{{p.sku}}</td><td>{{p.quantity}}</td><td>{{p.revenue | number:'1.0-0'}} FCFA</td>
    </tr>
    <tr *ngIf="!report.topProducts?.length"><td colspan="4">Aucune vente sur cette période.</td></tr>
  </table>
  <h2 *ngIf="report">Par catégorie</h2>
  <table *ngIf="report">
    <tr><th>Catégorie</th><th>Articles</th><th>Montant</th></tr>
    <tr *ngFor="let c of report.salesByCategory">
      <td>{{c.label}}</td><td>{{c.count}}</td><td>{{c.amount | number:'1.0-0'}} FCFA</td>
    </tr>
    <tr *ngIf="!report.salesByCategory?.length"><td colspan="3">Aucune vente sur cette période.</td></tr>
  </table>
  <h2 *ngIf="report">Par vendeur</h2>
  <table *ngIf="report">
    <tr><th>Vendeur</th><th>Articles</th><th>Montant</th></tr>
    <tr *ngFor="let v of report.salesByVendor">
      <td>{{v.label}}</td><td>{{v.count}}</td><td>{{v.amount | number:'1.0-0'}} FCFA</td>
    </tr>
    <tr *ngIf="!report.salesByVendor?.length"><td colspan="3">Aucune vente sur cette période.</td></tr>
  </table>
  <h2 *ngIf="report">Par quartier</h2>
  <table *ngIf="report">
    <tr><th>Zone</th><th>Commandes</th><th>Montant</th></tr>
    <tr *ngFor="let z of report.salesByZone">
      <td>{{z.label}}</td><td>{{z.count}}</td><td>{{z.amount | number:'1.0-0'}} FCFA</td>
    </tr>
    <tr *ngIf="!report.salesByZone?.length"><td colspan="3">Aucune vente sur cette période.</td></tr>
  </table>
  <h2 *ngIf="report">Par mode de paiement</h2>
  <table *ngIf="report">
    <tr><th>Mode</th><th>Commandes</th><th>Montant</th></tr>
    <tr *ngFor="let m of report.salesByPaymentMethod">
      <td>{{m.label}}</td><td>{{m.count}}</td><td>{{m.amount | number:'1.0-0'}} FCFA</td>
    </tr>
    <tr *ngIf="!report.salesByPaymentMethod?.length"><td colspan="3">Aucune vente sur cette période.</td></tr>
  </table>
</div>`,
  styles: [ADMIN_PAGE_STYLES, `h2{margin:22px 0 8px;font-size:16px}.kpis.secondary b{font-size:16px}`]
})
export class AdminReportsComponent {
  report: any;
  period: PeriodRange | null = null;
  constructor(private api: ApiService) {}
  onPeriod(p: PeriodRange) {
    this.period = p;
    this.api.reports(p.from, p.to, p.key === 'all').subscribe(r => this.report = r);
  }
  exportCsv() {
    const all = this.period?.key === 'all';
    const from = all ? undefined : this.period?.from;
    const to = all ? undefined : this.period?.to;
    this.api.exportReport(from, to, all).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = all ? 'rapport-dibidani-tout.csv' : from && to ? `rapport-dibidani-${from}-${to}.csv` : 'rapport-dibidani.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
