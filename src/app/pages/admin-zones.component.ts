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
    <div><h1>Zones de livraison</h1><p>Tarifs par quartier de Bamako.</p></div>
    <button class="btn" type="button" (click)="edit(null)">+ Nouvelle zone</button>
  </header>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <form class="card" *ngIf="form" (submit)="$event.preventDefault(); save()">
    <h2>{{form.id ? 'Modifier' : 'Nouvelle zone'}}</h2>
    <label>Ville<input [(ngModel)]="form.city" name="city" required></label>
    <label>Quartier<input [(ngModel)]="form.district" name="district" required></label>
    <label>Commune<input [(ngModel)]="form.commune" name="commune"></label>
    <label>Nom<input [(ngModel)]="form.name" name="name"></label>
    <label>Tarif standard<input type="number" [(ngModel)]="form.standardPrice" name="standardPrice" required></label>
    <label>Tarif express<input type="number" [(ngModel)]="form.expressPrice" name="expressPrice"></label>
    <label>Délai standard<input [(ngModel)]="form.estimatedStandardTime" name="estimatedStandardTime"></label>
    <label>Délai express<input [(ngModel)]="form.estimatedExpressTime" name="estimatedExpressTime"></label>
    <label>Actif<select [(ngModel)]="form.active" name="active"><option [ngValue]="true">Oui</option><option [ngValue]="false">Non</option></select></label>
    <div class="actions"><button class="btn">Enregistrer</button><button class="btn ghost" type="button" (click)="form=null">Annuler</button></div>
  </form>
  <table>
    <tr><th>Quartier</th><th>Standard</th><th>Express</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let z of rows">
      <td>{{z.district}} <small>{{z.city}}</small></td>
      <td>{{z.standardPrice | number:'1.0-0'}} FCFA</td>
      <td>{{z.expressPrice ? (z.expressPrice | number:'1.0-0') + ' FCFA' : '—'}}</td>
      <td><span class="tag" [class.off]="!z.active">{{z.active ? 'Actif' : 'Masqué'}}</span></td>
      <td class="row-actions">
        <button type="button" (click)="edit(z)">Modifier</button>
        <button type="button" (click)="remove(z)">Retirer</button>
      </td>
    </tr>
  </table>
</div>`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminZonesComponent implements OnInit {
  rows: any[] = []; form: any = null; msg = ''; err = '';
  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() { this.api.deliveryZones().subscribe(r => this.rows = r); }
  edit(z: any) {
    this.form = z ? {...z} : {city: 'Bamako', district: '', commune: '', name: '', standardPrice: 1500, expressPrice: 2500, estimatedStandardTime: '24 h', estimatedExpressTime: '2-4 h', active: true};
  }
  save() {
    this.api.saveZone(this.form, this.form.id).subscribe({
      next: () => { this.form = null; this.msg = 'Zone enregistrée.'; this.load(); },
      error: e => this.err = e.error?.message || 'Impossible.'
    });
  }
  remove(z: any) {
    if (!confirm('Retirer ' + z.district + ' ?')) return;
    this.api.deleteZone(z.id).subscribe({next: () => { this.msg = 'Retirée.'; this.load(); }, error: e => this.err = e.error?.message || 'Impossible.'});
  }
}
