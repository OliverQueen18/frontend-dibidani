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
    <div><h1>Marques</h1><p>Référentiel des marques du catalogue.</p></div>
    <button class="btn" *ngIf="auth.can('CATALOG_MANAGE')" type="button" (click)="edit(null)">+ Nouvelle marque</button>
  </header>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <form class="card" *ngIf="form" (submit)="$event.preventDefault(); save()">
    <h2>{{form.id ? 'Modifier' : 'Nouvelle marque'}}</h2>
    <label>Nom<input [(ngModel)]="form.name" name="name" required></label>
    <label>Logo<input [(ngModel)]="form.logoUrl" name="logoUrl"></label>
    <label>Actif<select [(ngModel)]="form.active" name="active"><option [ngValue]="true">Oui</option><option [ngValue]="false">Non</option></select></label>
    <div class="actions"><button class="btn">Enregistrer</button><button class="btn ghost" type="button" (click)="form=null">Annuler</button></div>
  </form>
  <table>
    <tr><th>Nom</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let b of rows">
      <td>{{b.name}}</td>
      <td><span class="tag" [class.off]="!b.active">{{b.active ? 'Actif' : 'Masqué'}}</span></td>
      <td class="row-actions" *ngIf="auth.can('CATALOG_MANAGE')">
        <button type="button" (click)="edit(b)">Modifier</button>
        <button type="button" class="danger" (click)="remove(b)">Supprimer</button>
      </td>
    </tr>
  </table>
</div>`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminBrandsComponent implements OnInit {
  rows: any[] = []; form: any = null; msg = ''; err = '';
  constructor(private api: ApiService, public auth: AuthService) {}
  ngOnInit() { this.load(); }
  load() { this.api.adminBrands().subscribe(r => this.rows = r); }
  edit(b: any) { this.form = b ? {...b} : {name: '', logoUrl: '', active: true}; }
  save() {
    this.api.saveBrand(this.form, this.form.id).subscribe({
      next: () => { this.form = null; this.msg = 'Marque enregistrée.'; this.load(); },
      error: e => this.err = e.error?.message || 'Impossible.'
    });
  }
  remove(b: any) {
    if (!confirm('Supprimer définitivement « ' + b.name + ' » ?')) return;
    this.api.deleteBrand(b.id).subscribe({next: () => { this.err = ''; this.msg = 'Marque supprimée.'; this.load(); }, error: e => this.err = e.error?.message || 'Impossible.'});
  }
}
