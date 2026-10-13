import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ApiService} from '../core/api.service';
import {Order} from '../core/models';
import {CommonModule} from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<main class="container confirm" *ngIf="order">
  <div class="check">✓</div>
  <h1>Commande reçue</h1>
  <p>Merci. Nous vérifions la disponibilité auprès des vendeurs, puis nous vous confirmons la commande.</p>
  <div class="box">
    <span>Numéro de commande</span><b>{{order.orderNumber}}</b>
    <span>Montant total</span><b>{{order.total.toLocaleString('fr-FR')}} FCFA</b>
    <span>Mode de paiement</span><b>{{order.paymentMethod}}</b>
    <span>Statut</span><b class="green">{{statusLabel}}</b>
    <span>Code de suivi</span><b>{{order.trackingCode}}</b>
  </div>
  <div class="actions">
    <a [routerLink]="['/track', order.orderNumber]">Voir ma commande</a>
    <a routerLink="/">Continuer mes achats</a>
  </div>
</main>`,
  styles: [`
.confirm{max-width:650px;text-align:center;padding:50px 20px}
.check{margin:auto;width:75px;height:75px;border-radius:50%;background:#0aa05b;color:#fff;display:grid;place-items:center;font-size:40px}
.box{margin:25px auto;background:#fff;border:1px solid #e3ebe8;border-radius:14px;padding:22px;display:grid;grid-template-columns:1fr 1fr;text-align:left;gap:12px}
.box span{color:#73837d}
.green{color:#078a4e}
.actions{display:flex;gap:12px;justify-content:center}
.actions a{background:#087a47;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none}
.actions a:last-child{background:#ff7900}
`]
})
export class ConfirmationComponent implements OnInit {
  order?: Order;
  constructor(private r: ActivatedRoute, private api: ApiService) {}
  get statusLabel() {
    const s = this.order?.status;
    if (s === 'CONFIRMED') return 'Confirmée au client';
    if (s === 'PAID') return 'Payée — à confirmer';
    return 'Reçue — disponibilité à vérifier';
  }
  ngOnInit() {
    this.api.order(this.r.snapshot.paramMap.get('number')!).subscribe(o => this.order = o);
  }
}
