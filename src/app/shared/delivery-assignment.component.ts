import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ApiService} from '../core/api.service';
import {ADMIN_PAGE_STYLES} from '../pages/admin-ui';

export function canAssignDelivery(method: string, status: string) {
  return method !== 'PICKUP' && !!status && !['DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].includes(status);
}

@Component({
  selector: 'app-delivery-assignment', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <form class="card" (ngSubmit)="assign()">
      <h2>Assigner {{orderNumber}} à un livreur</h2>
      <p class="full" *ngIf="delivery?.courierName">Livreur actuel : <b>{{delivery.courierName}}</b> · {{delivery.courierPhone}}</p>
      <p class="err full" role="alert" *ngIf="err">{{err}}</p>
      <p class="full" *ngIf="loading" role="status">Chargement des livreurs…</p>
      <p class="full" *ngIf="!loading && !couriers.length">Aucun livreur actif disponible. <a routerLink="/admin/livreurs">Gérer les livreurs</a></p>
      <label>Livreur actif<select name="courierId" [(ngModel)]="courierId" required [disabled]="loading || saving">
        <option [ngValue]="null">Choisir un livreur</option><option *ngFor="let c of couriers" [ngValue]="c.id">{{c.fullName}} — {{c.phone}}</option></select></label>
      <label>Instructions de livraison<textarea name="notes" [(ngModel)]="notes" maxlength="1000" [disabled]="saving"></textarea></label>
      <div class="actions"><button class="btn" [disabled]="loading || saving || !courierId">{{saving ? 'Assignation…' : 'Confirmer l’assignation'}}</button>
        <button class="btn ghost" type="button" (click)="cancelled.emit()" [disabled]="saving">Fermer</button></div>
    </form>`, styles: [ADMIN_PAGE_STYLES]
})
export class DeliveryAssignmentComponent implements OnChanges {
  @Input() orderId!: number;
  @Input() orderNumber = '';
  @Input() delivery: any;
  @Output() assigned = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();
  couriers: any[] = []; courierId: number | null = null; notes = ''; loading = false; saving = false; err = '';
  private loadVersion = 0;
  constructor(private api: ApiService) {}
  ngOnChanges() {
    const version = ++this.loadVersion;
    this.courierId = this.delivery?.courierId || null; this.notes = this.delivery?.notes || ''; this.err = ''; this.loading = true;
    this.api.couriers().subscribe({
      next: rows => {
        if (version !== this.loadVersion) return;
        this.couriers = rows; this.loading = false;
        if (!rows.some(c => c.id === this.courierId)) this.courierId = null;
      },
      error: () => { if (version === this.loadVersion) { this.loading = false; this.couriers = []; this.courierId = null; this.err = 'Impossible de charger les livreurs. Fermez puis réessayez.'; } }
    });
  }
  assign() {
    if (!this.courierId || this.saving || this.loading) return;
    this.saving = true; this.err = '';
    const orderId = this.orderId;
    this.api.assignDelivery(orderId, {courierId: this.courierId, notes: this.notes}).subscribe({
      next: delivery => { this.saving = false; this.assigned.emit({orderId, delivery}); },
      error: e => { this.saving = false; this.err = e.error?.message || 'Assignation impossible.'; }
    });
  }
}
