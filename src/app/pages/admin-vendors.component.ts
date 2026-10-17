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
  <header>
    <div><h1>Vendeurs</h1><p>Boutiques partenaires visibles sur le marché.</p></div>
    <button class="btn" *ngIf="auth.can('CATALOG_MANAGE')" type="button" (click)="edit(null)">+ Nouveau vendeur</button>
  </header>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <div class="filters">
    <input [(ngModel)]="q" placeholder="Rechercher un vendeur, un quartier…">
    <small>{{filtered.length}} vendeur{{filtered.length > 1 ? 's' : ''}}</small>
  </div>
  <form class="card" *ngIf="form" (submit)="$event.preventDefault(); save()">
    <h2>{{form.id ? 'Modifier' : 'Nouveau vendeur'}}</h2>
    <label>Nom<input [(ngModel)]="form.name" name="name" required></label>
    <label>Quartier<input [(ngModel)]="form.district" name="district"></label>
    <label>Téléphone<input [(ngModel)]="form.phone" name="phone"></label>
    <label>WhatsApp<input [(ngModel)]="form.whatsapp" name="whatsapp"></label>
    <label class="full">Adresse<input [(ngModel)]="form.address" name="address"></label>
    <label class="full">Description<textarea [(ngModel)]="form.description" name="description"></textarea></label>
    <label>Actif<select [(ngModel)]="form.active" name="active"><option [ngValue]="true">Oui</option><option [ngValue]="false">Non</option></select></label>
    <div class="actions"><button class="btn">Enregistrer</button><button class="btn ghost" type="button" (click)="form=null">Annuler</button></div>
  </form>
  <table>
    <tr><th>Vendeur</th><th>Quartier</th><th>Téléphone</th><th>Produits</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let v of filtered">
      <td>
        <img *ngIf="v.logoUrl" class="thumb" [src]="v.logoUrl" [alt]="v.name">
        <b>{{v.name}}</b>
      </td>
      <td>{{v.district || v.city || '—'}}</td>
      <td>{{v.phone || v.whatsapp || '—'}}</td>
      <td>{{v.productCount}}</td>
      <td><span class="tag" [class.off]="!v.active">{{v.active ? 'Actif' : 'Masqué'}}</span></td>
      <td class="row-actions" *ngIf="auth.can('CATALOG_MANAGE')">
        <button type="button" (click)="edit(v)">Modifier</button>
        <button type="button" class="danger" (click)="remove(v)">Supprimer</button>
      </td>
    </tr>
  </table>
</div>`,
  styles: [ADMIN_PAGE_STYLES, `.thumb{height:28px;max-width:48px;object-fit:contain;vertical-align:middle;margin-right:8px}.filters small{align-self:center;color:#6a7c75}`]
})
export class AdminVendorsComponent implements OnInit {
  rows: any[] = []; form: any = null; msg = ''; err = ''; q = '';
  constructor(private api: ApiService, public auth: AuthService) {}
  get filtered() {
    const n = this.q.trim().toLowerCase();
    if (!n) return this.rows;
    return this.rows.filter(v => [v.name, v.district, v.city, v.phone, v.whatsapp].join(' ').toLowerCase().includes(n));
  }
  ngOnInit() { this.load(); }
  load() { this.api.adminVendors().subscribe(v => this.rows = Array.isArray(v) ? v : (v.content || [])); }
  edit(v: any) {
    this.form = v ? {id: v.id, name: v.name, district: v.district, phone: v.phone, whatsapp: v.whatsapp, address: v.address, description: v.description, active: v.active, city: v.city || 'Bamako'} : {name: '', district: '', phone: '', whatsapp: '', address: '', description: '', city: 'Bamako', active: true};
  }
  save() {
    this.api.saveVendor(this.form, this.form.id).subscribe({
      next: () => { this.form = null; this.msg = 'Vendeur enregistré.'; this.load(); },
      error: e => this.err = e.error?.message || 'Impossible.'
    });
  }
  remove(v: any) {
    if (!confirm('Supprimer définitivement « ' + v.name + ' » ?')) return;
    this.api.deleteVendor(v.id).subscribe({next: () => { this.err = ''; this.msg = 'Vendeur supprimé.'; this.load(); }, error: e => this.err = e.error?.message || 'Impossible.'});
  }
}
