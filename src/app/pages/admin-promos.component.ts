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
  <header>
    <div><h1>Codes promo</h1><p>Remises et livraison offerte.</p></div>
    <button class="btn" type="button" (click)="edit(null)">+ Nouveau code</button>
  </header>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <form class="card" *ngIf="form" (submit)="$event.preventDefault(); save()">
    <h2>{{form.id ? 'Modifier' : 'Nouveau code'}}</h2>
    <label>Code<input [(ngModel)]="form.code" name="code" required></label>
    <label>Type
      <select [(ngModel)]="form.type" name="type">
        <option value="PERCENTAGE">Pourcentage</option>
        <option value="FIXED_AMOUNT">Montant fixe</option>
        <option value="FREE_DELIVERY">Livraison offerte</option>
      </select>
    </label>
    <label>Valeur<input type="number" [(ngModel)]="form.value" name="value" required></label>
    <label>Minimum panier<input type="number" [(ngModel)]="form.minSubtotal" name="minSubtotal"></label>
    <label class="full">Description<input [(ngModel)]="form.description" name="description"></label>
    <label>Actif<select [(ngModel)]="form.active" name="active"><option [ngValue]="true">Oui</option><option [ngValue]="false">Non</option></select></label>
    <div class="actions"><button class="btn">Enregistrer</button><button class="btn ghost" type="button" (click)="form=null">Annuler</button></div>
  </form>
  <table>
    <tr><th>Code</th><th>Type</th><th>Valeur</th><th>Utilisé</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let p of rows">
      <td>{{p.code}}</td><td>{{p.type}}</td><td>{{p.value}}</td><td>{{p.usedCount}} / {{p.usageLimit || '∞'}}</td>
      <td><span class="tag" [class.off]="!p.currentlyValid">{{p.currentlyValid ? 'Valide' : 'Inactif'}}</span></td>
      <td class="row-actions">
        <button type="button" (click)="edit(p)">Modifier</button>
        <button type="button" (click)="remove(p)">Désactiver</button>
      </td>
    </tr>
  </table>
</div>`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminPromosComponent implements OnInit {
  rows: any[] = []; form: any = null; msg = ''; err = '';
  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() { this.api.promoCodes().subscribe(r => this.rows = r); }
  edit(p: any) { this.form = p ? {...p} : {code: '', type: 'PERCENTAGE', value: 10, minSubtotal: 0, description: '', active: true}; }
  save() {
    this.api.savePromo(this.form, this.form.id).subscribe({
      next: () => { this.form = null; this.msg = 'Code enregistré.'; this.load(); },
      error: e => this.err = e.error?.message || 'Impossible.'
    });
  }
  remove(p: any) {
    if (!confirm('Désactiver ' + p.code + ' ?')) return;
    this.api.deletePromo(p.id).subscribe({next: () => { this.msg = 'Désactivé.'; this.load(); }, error: e => this.err = e.error?.message || 'Impossible.'});
  }
}
