import {Component, OnInit, effect} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {AuthService} from '../core/auth.service';
import {ProductPublishService} from '../core/product-publish.service';
import {ADMIN_PAGE_STYLES} from './admin-ui';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <header>
    <div><h1>Produits</h1><p>Catalogue publié sur la vitrine. La disponibilité se vérifie auprès des vendeurs à chaque commande — pas de stock d'entrepôt.</p></div>
    <button class="btn" *ngIf="auth.can('CATALOG_MANAGE')" type="button" (click)="publish.openNew()">+ Publier un produit</button>
  </header>
  <div class="filters"><input [(ngModel)]="q" (keyup.enter)="load()" placeholder="Rechercher un produit, un SKU ou un code-barres"><button type="button" (click)="load()">Filtrer</button></div>
  <p class="msg" *ngIf="msg">{{msg}}</p><p class="err" *ngIf="err">{{err}}</p>
  <table>
    <tr><th>Produit</th><th>SKU</th><th>Code-barres</th><th>Prix</th><th>Vendeur</th><th>Catégorie</th><th>Statut</th><th></th></tr>
    <tr *ngFor="let p of rows">
      <td>{{p.name}}</td><td>{{p.sku}}</td><td>{{p.barcode || '—'}}</td><td>FCFA {{p.price | number:'1.0-0'}}</td><td>{{p.vendor?.name || '—'}}</td>
      <td>{{p.category?.name}}</td>
      <td><span class="tag" [class.off]="p.active===false">{{p.active===false ? 'Masqué' : 'Actif'}}</span></td>
      <td class="row-actions" *ngIf="auth.can('CATALOG_MANAGE')">
        <button type="button" (click)="toggle(p)" [disabled]="busyId===p.id">{{p.active===false ? 'Activer' : 'Désactiver'}}</button>
        <button type="button" (click)="publish.openEdit(p.id)">Modifier</button>
        <button type="button" (click)="duplicate(p)">Dupliquer</button>
        <button type="button" (click)="remove(p)">Retirer</button>
      </td>
    </tr>
  </table>
</div>
`,
  styles: [ADMIN_PAGE_STYLES]
})
export class AdminProductsComponent implements OnInit {
  rows: any[] = [];
  q = '';
  busy = false;
  busyId: number | null = null;
  msg = '';
  err = '';
  private ready = false;
  private seenSavedAt = 0;
  constructor(private api: ApiService, public auth: AuthService, public publish: ProductPublishService) {
    effect(() => {
      const t = this.publish.lastSavedAt();
      if (this.ready && t && t !== this.seenSavedAt) {
        this.seenSavedAt = t;
        this.msg = 'Produit enregistré.';
        this.load();
      }
    });
  }
  ngOnInit() {
    this.ready = true;
    this.seenSavedAt = this.publish.lastSavedAt();
    this.load();
  }
  load() { this.api.adminProducts(this.q).subscribe(p => this.rows = p.content || p); }
  toggle(p: any) {
    if (!p?.id || this.busyId) return;
    const next = p.active === false;
    this.busyId = p.id;
    this.msg = '';
    this.err = '';
    this.api.setProductActive(p.id, next).subscribe({
      next: d => {
        this.busyId = null;
        p.active = d.active;
        this.msg = next ? 'Produit visible sur la vitrine.' : 'Produit masqué de la vitrine.';
      },
      error: e => { this.busyId = null; this.err = e.error?.message || 'Impossible de changer le statut.'; }
    });
  }
  duplicate(p: any) {
    if (!p?.id) return;
    this.busy = true; this.msg = ''; this.err = '';
    this.api.duplicateProduct(p.id).subscribe({
      next: d => {
        this.busy = false;
        this.load();
        this.publish.openEdit(d.id, d);
        this.msg = 'Copie créée (masquée). Vérifiez la fiche, puis publiez.';
      },
      error: e => { this.busy = false; this.err = e.error?.message || 'Duplication impossible.'; }
    });
  }
  remove(p: any) {
    if (!confirm('Retirer « ' + p.name + ' » de la vitrine ?')) return;
    this.api.deleteProduct(p.id).subscribe({next: () => { this.msg = 'Produit retiré.'; this.load(); }, error: e => this.err = e.error?.message || 'Impossible.'});
  }
}
