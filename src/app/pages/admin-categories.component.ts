import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {AuthService} from '../core/auth.service';
import {SettingsService} from '../core/settings.service';
import {ImagePickerComponent} from '../shared/image-picker.component';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ImagePickerComponent],
  template: `
<div class="page">
  <header>
    <div><h1>Catégories</h1><p>Menu de navigation et rayons de la vitrine.</p></div>
    <button class="btn" *ngIf="auth.can('CATALOG_MANAGE')" type="button" (click)="edit(null)">+ Nouvelle catégorie</button>
  </header>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <form class="card" *ngIf="form" (submit)="$event.preventDefault(); save()">
    <h2>{{form.id ? 'Modifier' : 'Nouvelle catégorie'}}</h2>
    <label>Nom<input [(ngModel)]="form.name" name="name" required></label>
    <label>Slug<input [(ngModel)]="form.slug" name="slug"></label>
    <label>Icône<input [(ngModel)]="form.icon" name="icon" placeholder="🛒"></label>
    <label>Parent
      <select [(ngModel)]="form.parentId" name="parentId">
        <option [ngValue]="null">Aucune (rayon principal)</option>
        <option *ngFor="let c of flat" [ngValue]="c.id" [disabled]="c.id===form.id">{{c.name}}</option>
      </select>
    </label>
    <label>Ordre<input type="number" [(ngModel)]="form.displayOrder" name="displayOrder"></label>
    <label class="full">Image
      <app-image-picker [url]="form.imageUrl || ''" (urlChange)="form.imageUrl=$event"></app-image-picker>
    </label>
    <label class="full">Description<textarea [(ngModel)]="form.description" name="description"></textarea></label>
    <label>Actif<select [(ngModel)]="form.active" name="active"><option [ngValue]="true">Oui</option><option [ngValue]="false">Non</option></select></label>
    <div class="actions"><button class="btn">Enregistrer</button><button class="btn ghost" type="button" (click)="form=null">Annuler</button></div>
  </form>
  <table>
    <tr><th>Nom</th><th>Slug</th><th>Parent</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let c of flat">
      <td>{{c.icon}} {{c.name}}</td><td>{{c.slug}}</td><td>{{c.parent?.name || '—'}}</td>
      <td><span class="tag" [class.off]="!c.active">{{c.active ? 'Actif' : 'Masqué'}}</span></td>
      <td class="row-actions" *ngIf="auth.can('CATALOG_MANAGE')">
        <button type="button" (click)="edit(c)">Modifier</button>
        <button type="button" class="danger" (click)="remove(c)">Supprimer</button>
      </td>
    </tr>
  </table>
</div>`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminCategoriesComponent implements OnInit {
  rows: any[] = []; flat: any[] = []; form: any = null; msg = ''; err = '';
  constructor(private api: ApiService, public auth: AuthService, private settings: SettingsService) {}
  ngOnInit() { this.load(); }
  load() { this.api.adminCategories().subscribe(r => { this.rows = r; this.flat = flatten(r); }); }
  edit(c: any) {
    this.form = c ? {id: c.id, name: c.name, slug: c.slug, icon: c.icon, parentId: c.parentId, displayOrder: c.displayOrder, imageUrl: c.imageUrl, description: c.description, active: c.active} : {name: '', slug: '', icon: '', parentId: null, displayOrder: 0, imageUrl: '', description: '', active: true};
  }
  save() {
    this.api.saveCategory(this.form, this.form.id).subscribe({
      next: () => { this.form = null; this.msg = 'Catégorie enregistrée.'; this.load(); this.settings.reload(); },
      error: e => this.err = e.error?.message || 'Impossible.'
    });
  }
  remove(c: any) {
    if (!confirm('Supprimer définitivement « ' + c.name + ' » ?')) return;
    this.api.deleteCategory(c.id).subscribe({next: () => { this.err = ''; this.msg = 'Catégorie supprimée.'; this.load(); this.settings.reload(); }, error: e => this.err = e.error?.message || 'Impossible.'});
  }
}
function flatten(rows: any[], out: any[] = []): any[] {
  for (const c of rows || []) { out.push(c); if (c.children?.length) flatten(c.children, out); }
  return out;
}
