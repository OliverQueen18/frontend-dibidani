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
  <header><div><h1>Commandes</h1><p>Vérifiez la disponibilité auprès des vendeurs, puis confirmez la commande au client. Dibidani ne gère pas de stock en entrepôt.</p></div></header>
  <div class="filters">
    <button type="button" [class.on]="!status" (click)="status=''; load()">Toutes</button>
    <button type="button" *ngFor="let s of statuses" [class.on]="status===s.status" (click)="status=s.status; load()">{{s.label}}</button>
  </div>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <table>
    <tr><th>N°</th><th>Client</th><th>Montant</th><th>Paiement</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let o of rows" [class.sel]="selected?.id===o.id">
      <td>{{o.orderNumber}}</td>
      <td>{{o.customerName}}<br><small>{{o.customerPhone}}</small></td>
      <td>{{o.total | number:'1.0-0'}} FCFA</td>
      <td>{{o.paymentMethodLabel || o.paymentMethod}}</td>
      <td><span class="tag">{{o.statusLabel || o.status}}</span></td>
      <td class="row-actions"><button type="button" (click)="open(o)">Ouvrir</button></td>
    </tr>
  </table>
  <div class="detail" *ngIf="selected">
    <h2>{{selected.orderNumber}} — {{selected.statusLabel}}</h2>
    <p>{{selected.customerName}} · {{selected.customerPhone}} · {{selected.deliveryAddress}}</p>
    <table>
      <tr><th>Article</th><th>Vendeur</th><th>Qté</th><th>Prix</th></tr>
      <tr *ngFor="let i of selected.items"><td>{{i.productName}}</td><td>{{i.vendorName || '—'}}</td><td>{{i.quantity}}</td><td>{{i.lineTotal | number:'1.0-0'}}</td></tr>
    </table>
    <p class="muted" *ngIf="canConfirm">Appelez les vendeurs ci-dessus. Si les articles sont disponibles, confirmez la commande au client.</p>
    <form class="card" (submit)="$event.preventDefault(); change()">
      <label>Nouveau statut
        <select [(ngModel)]="nextStatus" name="nextStatus">
          <option *ngFor="let t of selected.allowedTransitions || []" [ngValue]="t.status">{{t.label}}</option>
        </select>
      </label>
      <label>Commentaire<input [(ngModel)]="comment" name="comment" [placeholder]="canConfirm ? 'Disponibilité vérifiée auprès des vendeurs' : ''"></label>
      <label class="full">Note interne<input [(ngModel)]="note" name="note"></label>
      <div class="actions">
        <button class="btn" type="button" *ngIf="canConfirm" (click)="confirmVendor()">Confirmer au client</button>
        <button class="btn" type="submit" [disabled]="!nextStatus">Changer le statut</button>
        <button class="btn ghost" type="button" (click)="saveNote()">Enregistrer la note</button>
        <button class="btn ghost" type="button" (click)="pay()">Marquer payée</button>
      </div>
    </form>
  </div>
</div>`,
  styles: [ADMIN_PAGE_STYLES, `tr.sel{background:#eaf7f0}`]
})
export class AdminOrdersComponent implements OnInit {
  rows: any[] = []; statuses: any[] = []; selected: any; status = ''; nextStatus = ''; comment = ''; note = ''; msg = ''; err = '';
  get canConfirm() { return (this.selected?.allowedTransitions || []).some((t: any) => t.status === 'CONFIRMED'); }
  constructor(private api: ApiService) {}
  ngOnInit() {
    this.api.orderStatuses().subscribe(s => this.statuses = s);
    this.load();
  }
  load() { this.api.adminOrders({status: this.status, size: 40}).subscribe(p => this.rows = p.content || []); }
  open(o: any) {
    this.api.adminOrder(o.id).subscribe(d => {
      this.selected = d;
      this.nextStatus = d.allowedTransitions?.[0]?.status || '';
      this.note = d.adminNote || '';
    });
  }
  confirmVendor() {
    this.nextStatus = 'CONFIRMED';
    this.comment = this.comment || 'Disponibilité vérifiée auprès des vendeurs';
    this.change();
  }
  change() {
    this.api.changeOrderStatus(this.selected.id, this.nextStatus, this.comment).subscribe({
      next: d => { this.selected = d; this.msg = this.nextStatus === 'CONFIRMED' ? 'Commande confirmée au client.' : 'Statut mis à jour.'; this.load(); },
      error: e => this.err = e.error?.message || 'Transition refusée.'
    });
  }
  saveNote() {
    this.api.orderNote(this.selected.id, this.note).subscribe({next: d => { this.selected = d; this.msg = 'Note enregistrée.'; }, error: e => this.err = e.error?.message || 'Impossible.'});
  }
  pay() {
    this.api.markPaid(this.selected.id).subscribe({next: d => { this.selected = d; this.msg = 'Paiement enregistré.'; this.load(); }, error: e => this.err = e.error?.message || 'Impossible.'});
  }
}
