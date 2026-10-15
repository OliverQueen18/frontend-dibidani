import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {uploadErrorMessage} from '../core/image-upload';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <header>
    <div><h1>Publicités</h1><p>Bannières de la vitrine (hero, milieu de page, catégories).</p></div>
    <button class="btn" type="button" (click)="edit(null)">+ Nouvelle publicité</button>
  </header>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <form class="card" *ngIf="form" (submit)="$event.preventDefault(); save()">
    <h2>{{form.id ? 'Modifier' : 'Nouvelle publicité'}}</h2>
    <label>Titre<input [(ngModel)]="form.title" name="title" required></label>
    <label>Bouton<input [(ngModel)]="form.ctaLabel" name="ctaLabel"></label>
    <label>Position
      <select [(ngModel)]="form.position" name="position">
        <option *ngFor="let p of positions" [ngValue]="p">{{p}}</option>
      </select>
    </label>
    <label>Type
      <select [(ngModel)]="form.type" name="type">
        <option *ngFor="let t of types" [ngValue]="t">{{t}}</option>
      </select>
    </label>
    <label class="full">Texte<textarea [(ngModel)]="form.description" name="description"></textarea></label>
    <label class="full">Image<input [(ngModel)]="form.imageUrl" name="imageUrl"><input type="file" accept="image/*" (change)="upload($event)"></label>
    <label>Lien<input [(ngModel)]="form.targetUrl" name="targetUrl"></label>
    <label>Début<input type="datetime-local" [(ngModel)]="form.startLocal" name="startLocal"></label>
    <label>Fin<input type="datetime-local" [(ngModel)]="form.endLocal" name="endLocal"></label>
    <label>Ordre<input type="number" [(ngModel)]="form.displayOrder" name="displayOrder"></label>
    <label>Actif<select [(ngModel)]="form.active" name="active"><option [ngValue]="true">Oui</option><option [ngValue]="false">Non</option></select></label>
    <div class="actions"><button class="btn">Enregistrer</button><button class="btn ghost" type="button" (click)="form=null">Annuler</button></div>
  </form>
  <table>
    <tr><th>Titre</th><th>Position</th><th>Période</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let a of rows">
      <td>{{a.title}}</td><td>{{a.position}}</td>
      <td>{{a.startDate | date:'short'}} → {{a.endDate | date:'short'}}</td>
      <td><span class="tag" [class.off]="!a.visibleNow">{{a.visibleNow ? 'Visible' : (a.active ? 'Hors période' : 'Masquée')}}</span></td>
      <td class="row-actions">
        <button type="button" (click)="edit(a)">Modifier</button>
        <button type="button" (click)="remove(a)">Supprimer</button>
      </td>
    </tr>
  </table>
</div>`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminAdsComponent implements OnInit {
  rows: any[] = []; form: any = null; msg = ''; err = '';
  positions = ['HOME_HERO','HOME_TOP','HOME_MIDDLE','HOME_BOTTOM','CATEGORY_TOP','CATEGORY_MIDDLE','PRODUCT_SIDEBAR','CART','CHECKOUT'];
  types = ['BANNER','SLIDER','CARD','SPONSORED_PRODUCT'];
  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() { this.api.adminAds().subscribe(a => this.rows = Array.isArray(a) ? a : (a.content || [])); }
  edit(a: any) {
    const now = new Date();
    const later = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    this.form = a ? {
      ...a,
      startLocal: toLocal(a.startDate),
      endLocal: toLocal(a.endDate)
    } : {
      title: '', description: '', imageUrl: '', targetUrl: '/category/all', ctaLabel: 'Découvrir',
      position: 'HOME_TOP', type: 'BANNER', displayOrder: 0, active: true,
      startLocal: toLocal(now.toISOString()), endLocal: toLocal(later.toISOString())
    };
  }
  save() {
    const body = {
      ...this.form,
      startDate: new Date(this.form.startLocal).toISOString(),
      endDate: new Date(this.form.endLocal).toISOString()
    };
    this.api.saveAd(body, this.form.id).subscribe({
      next: () => { this.form = null; this.msg = 'Publicité enregistrée.'; this.load(); },
      error: e => this.err = e.error?.message || 'Impossible.'
    });
  }
  remove(a: any) {
    if (!confirm('Supprimer « ' + a.title + ' » ?')) return;
    this.api.deleteAd(a.id).subscribe({next: () => { this.msg = 'Supprimée.'; this.load(); }, error: e => this.err = e.error?.message || 'Impossible.'});
  }
  upload(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file || !this.form) return;
    this.err = '';
    this.msg = 'Envoi de l’image…';
    this.api.upload(file).subscribe({
      next: r => { this.msg = 'Image envoyée.'; this.form.imageUrl = r.url; },
      error: e => { this.msg = ''; this.err = uploadErrorMessage(e); }
    });
  }
}
function toLocal(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
