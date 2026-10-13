import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ApiService} from '../core/api.service';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page">
  <header><div><h1>Paiements</h1><p>Encaissements Orange Money, Wave, carte et espèces.</p></div></header>
  <div class="kpis">
    <div *ngFor="let s of stats"><small>{{s.status}}</small><b>{{s.count}}</b><em>{{s.amount | number:'1.0-0'}} FCFA</em></div>
  </div>
  <table>
    <tr><th>Commande</th><th>Client</th><th>Méthode</th><th>Montant</th><th>Statut</th><th>Date</th></tr>
    <tr *ngFor="let p of rows">
      <td>{{p.orderNumber}}</td>
      <td>{{p.customerName}}</td>
      <td>{{p.methodLabel || p.method}}</td>
      <td>{{p.amount | number:'1.0-0'}} FCFA</td>
      <td><span class="tag" [class.off]="p.status==='FAILED'">{{p.status}}</span></td>
      <td>{{p.paidAt || p.createdAt | date:'short'}}</td>
    </tr>
  </table>
</div>`,
  styles: [ADMIN_PAGE_STYLES, `.kpis em{color:#087a47;font-style:normal;font-size:12px}`]
})
export class AdminPaymentsComponent implements OnInit {
  rows: any[] = []; stats: any[] = [];
  constructor(private api: ApiService) {}
  ngOnInit() {
    this.api.payments().subscribe(p => this.rows = p.content || []);
    this.api.paymentStats().subscribe(s => this.stats = s);
  }
}
