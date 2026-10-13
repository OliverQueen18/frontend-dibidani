import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
    <header>
      <h1>Stocks</h1>
      <p>Seuil minimum, alertes de rupture et historique de chaque mouvement.</p>
    </header>
    <div class="kpis" *ngIf="overview">
      <div><small>Produits actifs</small><b>{{overview.products}}</b></div>
      <div class="low"><small>Stock faible</small><b>{{overview.low}}</b></div>
      <div class="out"><small>Rupture</small><b>{{overview.out}}</b></div>
    </div>
    <div class="filters">
      <button [class.on]="filter==='all'" (click)="load('all')">Tous</button>
      <button [class.on]="filter==='low'" (click)="load('low')">Stock faible</button>
      <button [class.on]="filter==='out'" (click)="load('out')">Rupture</button>
      <input [(ngModel)]="q" (keyup.enter)="load(filter)" placeholder="Rechercher un produit ou un SKU">
    </div>
    <table>
      <thead><tr><th>Produit</th><th>SKU</th><th>Stock</th><th>Seuil</th><th>Niveau</th><th *ngIf="auth.can('STOCK_MANAGE')"></th></tr></thead>
      <tbody>
        <tr *ngFor="let r of rows" (click)="open(r)" [class.sel]="selected?.productId===r.productId">
          <td>{{r.name}}</td><td>{{r.sku}}</td><td>{{r.stock}} {{r.unit}}</td><td>{{r.lowStockThreshold}}</td>
          <td><span [class]="r.level">{{r.level === 'OUT' ? 'Rupture' : r.level === 'LOW' ? 'Faible' : 'OK'}}</span></td>
          <td *ngIf="auth.can('STOCK_MANAGE')"><button (click)="open(r); $event.stopPropagation()">Mouvement</button></td>
        </tr>
      </tbody>
    </table>
    <div class="history" *ngIf="selected">
      <h2>Historique — {{selected.name}}</h2>
      <form *ngIf="auth.can('STOCK_MANAGE')" (submit)="$event.preventDefault(); move()">
        <select [(ngModel)]="moveType" name="type">
          <option *ngFor="let t of types" [value]="t.type" [disabled]="!t.manual">{{t.label}}</option>
        </select>
        <input type="number" min="0" [(ngModel)]="qty" name="qty" placeholder="Quantité">
        <input [(ngModel)]="comment" name="comment" placeholder="Commentaire" required>
        <input [(ngModel)]="reference" name="reference" placeholder="Référence (BL, inventaire…)">
        <button [disabled]="busy">Enregistrer</button>
        <small>{{msg}}</small>
      </form>
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Avant</th><th>Mouvement</th><th>Après</th><th>Réf.</th><th>Par</th><th>Commentaire</th></tr></thead>
        <tbody>
          <tr *ngFor="let m of movements">
            <td>{{m.createdAt | date:'short'}}</td>
            <td>{{m.typeLabel}}</td>
            <td>{{m.quantityBefore}}</td>
            <td [class.neg]="m.quantity<0">{{m.quantity > 0 ? '+' : ''}}{{m.quantity}}</td>
            <td>{{m.stockAfter}}</td>
            <td>{{m.reference}}</td>
            <td>{{m.createdBy}}</td>
            <td>{{m.comment}}</td>
          </tr>
        </tbody>
      </table>
    </div>
</div>
`,
  styles: [`
.page{padding:4px}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
.kpis div{background:#fff;border:1px solid #E3EAE2;border-radius:12px;padding:16px}
.kpis .low b{color:#FD8D0B}.kpis .out b{color:#B42318}
.filters{display:flex;gap:8px;margin-bottom:16px}
.filters button{border:1px solid #E3EAE2;background:#fff;border-radius:8px;padding:8px 12px}
.filters button.on{background:#3F8317;color:#fff;border-color:#3F8317}
.filters input{flex:1;padding:8px 12px;border:1px solid #E3EAE2;border-radius:8px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:10px;border-bottom:1px solid #E3EAE2;font-size:13px}
tr.sel{background:#F3F8EF}
span.OK{color:#3F8317} span.LOW{color:#FD8D0B} span.OUT{color:#B42318}
.history{margin-top:24px}.history form{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.history input,.history select{padding:8px;border:1px solid #E3EAE2;border-radius:8px}
.history button{background:#FD8D0B;color:#fff;border:0;border-radius:8px;padding:8px 14px}
.neg{color:#B42318}
`]
})
export class AdminStockComponent implements OnInit {
  overview: any; rows: any[] = []; movements: any[] = []; types: any[] = [];
  selected: any; filter = 'all'; q = ''; moveType = 'PURCHASE'; qty = 1; comment = ''; reference = ''; busy = false; msg = '';
  constructor(private http: HttpClient, public auth: AuthService) {}
  ngOnInit() {
    this.http.get('/api/v1/admin/stocks/overview').subscribe(o => this.overview = o);
    this.http.get<any[]>('/api/v1/admin/stocks/types').subscribe(t => this.types = t.filter(x => x.manual));
    this.load('all');
  }
  load(filter: string) {
    this.filter = filter;
    this.http.get<any>('/api/v1/admin/stocks', { params: { filter, q: this.q, size: 50 } }).subscribe(p => this.rows = p.content || []);
  }
  open(r: any) {
    this.selected = r;
    this.http.get<any>('/api/v1/admin/stocks/movements', { params: { productId: r.productId, size: 50 } }).subscribe(p => this.movements = p.content || []);
  }
  move() {
    if (!this.selected) return;
    this.busy = true; this.msg = '';
    this.http.post('/api/v1/admin/stocks/adjust', {
      productId: this.selected.productId, type: this.moveType, quantity: this.qty, comment: this.comment, reference: this.reference
    }).subscribe({
      next: (row: any) => { this.busy = false; this.comment = ''; this.load(this.filter); this.open(row); },
      error: e => { this.busy = false; this.msg = e.error?.message || 'Mouvement refusé'; }
    });
  }
}
