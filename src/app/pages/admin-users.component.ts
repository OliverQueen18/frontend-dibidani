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
    <div><h1>Utilisateurs</h1><p>Comptes staff du back-office.</p></div>
    <button class="btn" type="button" (click)="edit(null)">+ Nouvel utilisateur</button>
  </header>
  <div class="filters"><input [(ngModel)]="q" (keyup.enter)="load()" placeholder="Nom ou e-mail"><button type="button" (click)="load()">Filtrer</button></div>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <form class="card" *ngIf="form" (submit)="$event.preventDefault(); save()">
    <h2>{{form.id ? 'Modifier' : 'Nouvel utilisateur'}}</h2>
    <label>Nom<input [(ngModel)]="form.fullName" name="fullName" required></label>
    <label>E-mail<input [(ngModel)]="form.email" name="email" [disabled]="!!form.id" required></label>
    <label>Téléphone<input [(ngModel)]="form.phone" name="phone"></label>
    <label>Rôle
      <select [(ngModel)]="form.role" name="role">
        <option *ngFor="let r of staffRoles" [ngValue]="r.role">{{r.label}}</option>
      </select>
    </label>
    <label>Mot de passe<input type="password" [(ngModel)]="form.password" name="password" [required]="!form.id" placeholder="8 caractères min."></label>
    <label *ngIf="form.id">Actif<select [(ngModel)]="form.active" name="active"><option [ngValue]="true">Oui</option><option [ngValue]="false">Non</option></select></label>
    <div class="actions"><button class="btn">Enregistrer</button><button class="btn ghost" type="button" (click)="form=null">Annuler</button></div>
  </form>
  <table>
    <tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let u of rows">
      <td>{{u.fullName}}</td><td>{{u.email}}</td><td>{{u.role}}</td>
      <td><span class="tag" [class.off]="!u.active">{{u.active ? 'Actif' : 'Inactif'}}</span></td>
      <td class="row-actions"><button type="button" (click)="edit(u)">Modifier</button></td>
    </tr>
  </table>
</div>`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminUsersComponent implements OnInit {
  rows: any[] = []; roles: any[] = []; form: any = null; q = ''; msg = ''; err = '';
  constructor(private api: ApiService) {}
  get staffRoles() { return (this.roles || []).filter((r: any) => r.role !== 'CUSTOMER' && r.role !== 'SELLER'); }
  ngOnInit() {
    this.api.roles().subscribe(r => this.roles = r);
    this.load();
  }
  load() { this.api.users(this.q).subscribe(p => this.rows = p.content || []); }
  edit(u: any) {
    this.form = u ? {id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, role: u.role, active: u.active, password: ''} : {fullName: '', email: '', phone: '', role: 'MANAGER', password: ''};
  }
  save() {
    const body = {...this.form};
    if (!body.password) delete body.password;
    this.api.saveUser(body, this.form.id).subscribe({
      next: () => { this.form = null; this.msg = 'Utilisateur enregistré.'; this.load(); },
      error: e => this.err = e.error?.message || 'Impossible.'
    });
  }
}
