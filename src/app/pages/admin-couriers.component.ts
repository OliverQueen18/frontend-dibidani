import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ApiService} from '../core/api.service';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="page">
    <header><div><h1>Livreurs</h1><p>Gérez les coordonnées et les comptes de vos livreurs.</p></div>
      <button class="btn" type="button" (click)="edit()" [disabled]="saving">+ Nouveau livreur</button></header>
    <div class="filters"><input [(ngModel)]="q" (keyup.enter)="search()" aria-label="Rechercher un livreur" placeholder="Nom, téléphone ou e-mail">
      <button type="button" (click)="search()" [disabled]="loading">Rechercher</button><a routerLink="/admin/livraisons">Assigner des livraisons</a></div>
    <p class="msg" role="status" *ngIf="msg">{{msg}}</p><p class="err" role="alert" *ngIf="err">{{err}}</p>
    <form class="card" *ngIf="form" #courierForm="ngForm" (ngSubmit)="save()">
      <h2>{{form.id ? 'Modifier le livreur' : 'Nouveau livreur'}}</h2>
      <label>Nom complet<input [(ngModel)]="form.fullName" name="fullName" required maxlength="255" [disabled]="saving"></label>
      <label>E-mail<input type="email" email [(ngModel)]="form.email" name="email" required maxlength="255" [disabled]="saving || !!form.id"></label>
      <label>Téléphone<input type="tel" [(ngModel)]="form.phone" name="phone" required pattern="[+0-9 ().-]{6,25}" maxlength="25" [disabled]="saving"></label>
      <label>{{form.id ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe'}}<input type="password" [(ngModel)]="form.password" name="password" autocomplete="new-password" [required]="!form.id" minlength="8" maxlength="100" [disabled]="saving"></label>
      <label *ngIf="form.id">Statut<select [(ngModel)]="form.active" name="active" [disabled]="saving"><option [ngValue]="true">Actif</option><option [ngValue]="false">Inactif</option></select></label>
      <p class="full muted">Un livreur inactif ne peut plus se connecter ni recevoir de nouvelle assignation. Ses livraisons déjà assignées restent visibles et peuvent être réassignées.</p>
      <div class="actions"><button class="btn" [disabled]="saving || courierForm.invalid">{{saving ? 'Enregistrement…' : 'Enregistrer'}}</button>
        <button class="btn ghost" type="button" (click)="form=null" [disabled]="saving">Annuler</button></div>
    </form>
    <p *ngIf="loading" role="status">Chargement des livreurs…</p>
    <p *ngIf="!loading && !rows.length && !err">Aucun livreur trouvé. Ajoutez un livreur pour lui assigner des commandes.</p>
    <div class="table-wrap" *ngIf="rows.length"><table><tr><th>Nom</th><th>Téléphone</th><th>E-mail</th><th>Statut</th><th></th></tr>
      <tr *ngFor="let c of rows"><td>{{c.fullName}}</td><td>{{c.phone || '—'}}</td><td>{{c.email}}</td>
        <td><span class="tag" [class.off]="!c.active">{{c.active ? 'Actif' : 'Inactif'}}</span></td>
        <td class="row-actions"><button type="button" (click)="edit(c)" [disabled]="saving">Modifier</button></td></tr></table></div>
    <div class="actions" *ngIf="totalPages>1"><button type="button" (click)="page=page-1; load()" [disabled]="loading || page===0">Précédent</button>
      <span>Page {{page+1}} / {{totalPages}}</span><button type="button" (click)="page=page+1; load()" [disabled]="loading || page+1>=totalPages">Suivant</button></div>
  </div>`, styles: [ADMIN_PAGE_STYLES, '.table-wrap{overflow:auto}']
})
export class AdminCouriersComponent implements OnInit {
  rows: any[] = []; form: any = null; q = ''; page = 0; totalPages = 0;
  msg = ''; err = ''; loading = false; saving = false;
  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  search() { this.page = 0; this.load(); }
  load() {
    this.loading = true; this.err = '';
    this.api.manageCouriers(this.q, this.page).subscribe({
      next: p => { this.rows = p.content || []; this.totalPages = p.totalPages; this.loading = false; },
      error: e => { this.loading = false; this.err = e.error?.message || 'Impossible de charger les livreurs.'; }
    });
  }
  edit(c?: any) {
    this.err = ''; this.msg = '';
    this.form = c ? {...c, password: ''} : {fullName: '', email: '', phone: '+223 ', password: '', active: true};
  }
  save() {
    if (!this.form || this.saving) return;
    const body = {...this.form, fullName: this.form.fullName.trim(), phone: this.form.phone.trim(), email: this.form.email.trim()};
    if (!body.password) delete body.password;
    this.saving = true; this.err = ''; this.msg = '';
    this.api.saveCourier(body, this.form.id).subscribe({
      next: () => { this.saving = false; this.form = null; this.msg = 'Livreur enregistré.'; this.load(); },
      error: e => { this.saving = false; this.err = e.error?.message || 'Impossible d’enregistrer le livreur.'; }
    });
  }
}
