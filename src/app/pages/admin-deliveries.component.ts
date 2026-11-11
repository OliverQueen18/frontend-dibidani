import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {ADMIN_PAGE_STYLES} from './admin-ui';
import {RouterLink} from '@angular/router';
import {DeliveryAssignmentComponent, canAssignDelivery} from '../shared/delivery-assignment.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DeliveryAssignmentComponent],
  template: `
<div class="page">
  <header><div><h1>Livraisons</h1><p>Tournées, livreurs et adresses à Bamako.</p></div><a routerLink="/admin/livreurs" class="btn">Gérer les livreurs</a></header>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <app-delivery-assignment *ngIf="pick" [orderId]="pick.orderId" [orderNumber]="pick.orderNumber" [delivery]="pick" (assigned)="assigned()" (cancelled)="pick=null"></app-delivery-assignment>
  <p *ngIf="loading">Chargement des livraisons…</p><p *ngIf="!loading && !rows.length && !err">Aucune livraison.</p>
  <table>
    <tr><th>Commande</th><th>Client</th><th>Zone</th><th>Livreur</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let d of rows">
      <td>{{d.orderNumber}}</td>
      <td>{{d.customerName}}<br><small>{{d.address}}</small></td>
      <td>{{d.zone}}</td>
      <td>{{d.courierName || 'Non assigné'}}<br><small>{{d.courierPhone}}</small></td>
      <td><span class="tag">{{statusLabels[d.status] || d.status}}</span></td>
      <td class="row-actions"><button type="button" (click)="pick=d" [disabled]="!!pick" *ngIf="canAssign(d.method,d.orderStatus)">{{d.courierName ? 'Réassigner' : 'Assigner'}}</button></td>
    </tr>
  </table>
  <div class="actions" *ngIf="totalPages>1"><button type="button" (click)="page=page-1; load()" [disabled]="loading || !!pick || page===0">Précédent</button>
    <span>Page {{page+1}} / {{totalPages}}</span><button type="button" (click)="page=page+1; load()" [disabled]="loading || !!pick || page+1>=totalPages">Suivant</button></div>
</div>`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminDeliveriesComponent implements OnInit {
  rows: any[] = []; pick: any; msg = ''; err = ''; page = 0; totalPages = 0; loading = false;
  canAssign = canAssignDelivery;
  statusLabels: Record<string, string> = {PENDING:'En attente', ASSIGNED:'Assignée', PICKED_UP:'En livraison', DELIVERED:'Livrée', CANCELLED:'Annulée', RETURNED:'Retournée'};
  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() {
    this.loading = true; this.err = '';
    this.api.deliveries(this.page).subscribe({
      next: p => { this.rows = p.content || []; this.totalPages = p.totalPages; this.loading = false; },
      error: e => { this.loading = false; this.err = e.error?.message || 'Impossible de charger les livraisons.'; }
    });
  }
  assigned() { this.msg = 'Livraison assignée.'; this.pick = null; this.load(); }
}
