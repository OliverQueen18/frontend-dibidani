import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {AuthService} from '../core/auth.service';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <header><div><h1>Clients</h1><p>Comptes acheteurs et historique d'achats.</p></div></header>
  <div class="filters"><input [(ngModel)]="q" (keyup.enter)="load()" placeholder="Nom, e-mail ou téléphone"><button type="button" (click)="load()">Filtrer</button></div>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <table>
    <tr><th>Client</th><th>Contact</th><th>Commandes</th><th>Dépensé</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let c of rows">
      <td>{{c.fullName}}<br><small>{{c.email}}</small></td>
      <td>{{c.phone}}</td>
      <td>{{c.orders}}</td>
      <td>{{c.totalSpent | number:'1.0-0'}} FCFA</td>
      <td><span class="tag" [class.off]="!c.active">{{c.active ? 'Actif' : 'Suspendu'}}</span></td>
      <td class="row-actions">
        <button type="button" (click)="open(c)">Fiche</button>
        <button type="button" *ngIf="auth.can('CUSTOMERS_MANAGE')" (click)="toggle(c)">{{c.active ? 'Suspendre' : 'Activer'}}</button>
      </td>
    </tr>
  </table>
  <div class="detail" *ngIf="detail">
    <h2>{{detail.customer.fullName}}</h2>
    <p>{{detail.customer.email}} · {{detail.customer.phone}}</p>
    <p>{{detail.favoritesCount}} favoris</p>
    <table>
      <tr><th>Commande</th><th>Montant</th><th>Statut</th></tr>
      <tr *ngFor="let o of detail.orders"><td>{{o.orderNumber}}</td><td>{{o.total | number:'1.0-0'}}</td><td>{{o.statusLabel || o.status}}</td></tr>
    </table>
  </div>
</div>`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminCustomersComponent implements OnInit {
  rows: any[] = []; detail: any; q = ''; msg = ''; err = '';
  constructor(private api: ApiService, public auth: AuthService) {}
  ngOnInit() { this.load(); }
  load() { this.api.customers(this.q).subscribe(p => this.rows = p.content || []); }
  open(c: any) { this.api.customer(c.id).subscribe(d => this.detail = d); }
  toggle(c: any) {
    this.api.setCustomerActive(c.id, !c.active).subscribe({
      next: () => { this.msg = c.active ? 'Client suspendu.' : 'Client réactivé.'; this.load(); if (this.detail?.customer?.id === c.id) this.open(c); },
      error: e => this.err = e.error?.message || 'Impossible.'
    });
  }
}
