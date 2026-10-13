import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <header><div><h1>Livraisons</h1><p>Tournées, livreurs et adresses à Bamako.</p></div></header>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <table>
    <tr><th>Commande</th><th>Client</th><th>Zone</th><th>Livreur</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let d of rows">
      <td>{{d.orderNumber}}</td>
      <td>{{d.customerName}}<br><small>{{d.address}}</small></td>
      <td>{{d.zone}}</td>
      <td>{{d.courierName || 'Non assigné'}}</td>
      <td><span class="tag">{{d.status}}</span></td>
      <td class="row-actions"><button type="button" (click)="pick=d">Assigner</button></td>
    </tr>
  </table>
  <form class="card" *ngIf="pick" (submit)="$event.preventDefault(); assign()">
    <h2>Assigner {{pick.orderNumber}}</h2>
    <label>Livreur
      <select [(ngModel)]="courierId" name="courierId">
        <option [ngValue]="null">Saisie manuelle</option>
        <option *ngFor="let c of couriers" [ngValue]="c.id">{{c.fullName}}</option>
      </select>
    </label>
    <label>Nom<input [(ngModel)]="courierName" name="courierName"></label>
    <label>Téléphone<input [(ngModel)]="courierPhone" name="courierPhone"></label>
    <label class="full">Notes<input [(ngModel)]="notes" name="notes"></label>
    <div class="actions"><button class="btn">Enregistrer</button><button class="btn ghost" type="button" (click)="pick=null">Annuler</button></div>
  </form>
</div>`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminDeliveriesComponent implements OnInit {
  rows: any[] = []; couriers: any[] = []; pick: any; courierId: number | null = null; courierName = ''; courierPhone = ''; notes = ''; msg = ''; err = '';
  constructor(private api: ApiService) {}
  ngOnInit() {
    this.api.deliveries().subscribe(p => this.rows = p.content || []);
    this.api.couriers().subscribe(c => this.couriers = c);
  }
  assign() {
    if (!this.pick) return;
    this.api.assignDelivery(this.pick.orderId, {courierId: this.courierId, courierName: this.courierName, courierPhone: this.courierPhone, notes: this.notes}).subscribe({
      next: () => { this.msg = 'Livraison assignée.'; this.pick = null; this.api.deliveries().subscribe(p => this.rows = p.content || []); },
      error: e => this.err = e.error?.message || 'Impossible.'
    });
  }
}
