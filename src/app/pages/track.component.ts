import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {Order} from '../core/models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<main class="container track">
  <h1>Suivi de commande</h1>
  <div class="search-track">
    <input [(ngModel)]="number" placeholder="DBD-20261007-000123">
    <button (click)="load()">Suivre</button>
  </div>
  <section *ngIf="order">
    <h2>Commande : {{order.orderNumber}}</h2>
    <p class="hint">{{hint}}</p>
    <div class="timeline">
      <div [class.done]="step >= 1">✓ <b>Commande reçue</b><small>Nous avons bien enregistré votre demande</small></div>
      <div [class.done]="step >= 2">● <b>Confirmée auprès des vendeurs</b><small>Disponibilité vérifiée, commande confirmée</small></div>
      <div [class.done]="step >= 3">● <b>En préparation</b><small>Préparation par Dibidani</small></div>
      <div [class.done]="step >= 4">● <b>En livraison</b><small>Votre commande est en route</small></div>
      <div [class.done]="step >= 5">● <b>Livrée</b><small>Commande remise</small></div>
    </div>
    <div class="delivery">
      🛵
      <div>
        <b>Livraison à {{order.deliveryAddress}}</b>
        <small>Code : {{order.trackingCode}}</small>
      </div>
      <button>Contacter</button>
    </div>
  </section>
</main>`,
  styles: [`
.track{max-width:800px;padding-top:35px}
.search-track{display:flex;margin:15px 0 25px}
.search-track input{flex:1;padding:13px;border:1px solid #dae5e0;border-radius:8px 0 0 8px}
.search-track button{background:#087a47;color:#fff;border:0;padding:0 20px;border-radius:0 8px 8px 0}
.track section{background:#fff;border:1px solid #e3ebe8;border-radius:14px;padding:25px}
.hint{color:#5a6d66;font-size:14px}
.timeline{border-left:3px solid #dfe7e4;margin-left:15px}
.timeline div{display:grid;grid-template-columns:25px 1fr;padding:10px 0 15px 18px;color:#9aa5a1}
.timeline b{color:#41534c}
.timeline small{grid-column:2}
.timeline .done{color:#0a9857}
.delivery{display:flex;gap:15px;align-items:center;background:#f5faf7;padding:15px;border-radius:10px}
.delivery div{display:flex;flex-direction:column;flex:1}
.delivery button{border:1px solid #ff7900;color:#ff7900;background:#fff;border-radius:7px;padding:9px}
`]
})
export class TrackComponent implements OnInit {
  number = '';
  order?: Order;
  constructor(private r: ActivatedRoute, private api: ApiService) {}
  get step() {
    const s = this.order?.status || '';
    if (s === 'DELIVERED') return 5;
    if (s === 'OUT_FOR_DELIVERY') return 4;
    if (s === 'PREPARING' || s === 'READY_FOR_DELIVERY') return 3;
    if (s === 'CONFIRMED') return 2;
    return 1;
  }
  get hint() {
    if (this.step === 1) return 'Nous contactons les vendeurs pour confirmer la disponibilité.';
    if (this.step === 2) return 'La commande a été confirmée après vérification auprès des vendeurs.';
    return '';
  }
  ngOnInit() {
    this.number = this.r.snapshot.paramMap.get('number') || '';
    if (this.number) this.load();
  }
  load() {
    if (this.number) this.api.order(this.number).subscribe(o => this.order = o);
  }
}
