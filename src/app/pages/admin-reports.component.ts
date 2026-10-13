import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ApiService} from '../core/api.service';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page">
  <header>
    <div><h1>Statistiques</h1><p>Ventes, catégories et meilleurs produits.</p></div>
    <button class="btn" type="button" (click)="exportCsv()">Exporter CSV</button>
  </header>
  <div class="kpis" *ngIf="report">
    <div><small>Chiffre d'affaires</small><b>{{report.revenue | number:'1.0-0'}} FCFA</b></div>
    <div><small>Commandes</small><b>{{report.orders}}</b></div>
    <div><small>Panier moyen</small><b>{{report.averageBasket | number:'1.0-0'}} FCFA</b></div>
    <div><small>Nouveaux clients</small><b>{{report.newCustomers}}</b></div>
  </div>
  <table *ngIf="report">
    <tr><th>Produit</th><th>SKU</th><th>Qté</th><th>CA</th></tr>
    <tr *ngFor="let p of report.topProducts">
      <td>{{p.name}}</td><td>{{p.sku}}</td><td>{{p.quantity}}</td><td>{{p.revenue | number:'1.0-0'}} FCFA</td>
    </tr>
  </table>
  <h2 *ngIf="report">Par catégorie</h2>
  <table *ngIf="report">
    <tr><th>Catégorie</th><th>Commandes</th><th>Montant</th></tr>
    <tr *ngFor="let c of report.salesByCategory">
      <td>{{c.label}}</td><td>{{c.count}}</td><td>{{c.amount | number:'1.0-0'}} FCFA</td>
    </tr>
  </table>
</div>`,
  styles: [ADMIN_PAGE_STYLES, `h2{margin:22px 0 8px;font-size:16px}`]
})
export class AdminReportsComponent implements OnInit {
  report: any;
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.reports().subscribe(r => this.report = r); }
  exportCsv() {
    this.api.exportReport().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rapport-dibidani.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
