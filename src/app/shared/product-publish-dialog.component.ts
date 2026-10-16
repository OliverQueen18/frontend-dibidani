import { Component, ElementRef, HostListener, ViewChild, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { uploadErrorMessage } from '../core/image-upload';
import { AuthService } from '../core/auth.service';
import { ProductPublishService, ProductPublishSession } from '../core/product-publish.service';
import { ProductPhotoStudioComponent } from './product-photo-studio.component';
import { ImagePickerComponent } from './image-picker.component';

type Step = 1 | 2 | 3;
type QuickKind = 'category' | 'brand' | 'unit' | null;

@Component({
  selector: 'app-product-publish-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductPhotoStudioComponent, ImagePickerComponent],
  template: `
<div class="scrim" *ngIf="open" role="presentation">
  <section class="sheet" role="dialog" aria-modal="true" [attr.aria-labelledby]="'pub-title'">
    <header>
      <div>
        <p class="kicker">{{seller ? 'Ma boutique' : 'Responsable catalogue'}}</p>
        <h2 id="pub-title">{{form?.id ? 'Modifier le produit' : 'Publier un produit'}}</h2>
      </div>
      <button type="button" class="x" (click)="cancel()" aria-label="Fermer">×</button>
    </header>
    <input #shot type="file" accept="image/*" capture="environment" hidden (change)="scanPhoto($event)">

    <ol class="steps" aria-label="Étapes">
      <li [class.on]="step===1" [class.done]="step>1"><b>1</b><span>Identité</span></li>
      <li [class.on]="step===2" [class.done]="step>2"><b>2</b><span>Photos</span></li>
      <li [class.on]="step===3"><b>3</b><span>Fiche et publication</span></li>
    </ol>

    <p class="err" *ngIf="err">{{err}}</p>
    <p class="ok" *ngIf="hint">{{hint}}</p>

    <form class="body" *ngIf="form" (submit)="$event.preventDefault()">
      <div class="pane" *ngIf="step===1">
        <div class="fields">
          <label class="full">Nom du produit
            <input [(ngModel)]="form.name" name="name" required placeholder="Ex. Batterie 70 Ah Varta" (blur)="ensureSku()">
          </label>
          <label>Catégorie
            <div class="pick">
              <select [(ngModel)]="form.categoryId" name="categoryId" required>
                <option [ngValue]="null">Choisir</option>
                <option *ngFor="let c of cats" [ngValue]="c.id">{{c.label}}</option>
              </select>
              <button type="button" class="add" *ngIf="!seller" (click)="openQuick('category')" [attr.aria-expanded]="quick==='category'">+</button>
            </div>
          </label>
          <label>Marque
            <div class="pick">
              <select [(ngModel)]="form.brandId" name="brandId">
                <option [ngValue]="null">Aucune</option>
                <option *ngFor="let b of brands" [ngValue]="b.id">{{b.name}}</option>
              </select>
              <button type="button" class="add" *ngIf="!seller" (click)="openQuick('brand')">+</button>
            </div>
          </label>
          <div class="full quick" *ngIf="quick==='category'">
            <b>Nouvelle catégorie</b>
            <input [(ngModel)]="draft.name" name="newCat" placeholder="Nom (ex. Éclairage)">
            <select [(ngModel)]="draft.parentId" name="newCatParent">
              <option [ngValue]="null">Rayon principal</option>
              <option *ngFor="let c of cats" [ngValue]="c.id">{{c.label}}</option>
            </select>
            <div class="quick-actions">
              <button type="button" (click)="createCategory()" [disabled]="busy">Ajouter</button>
              <button type="button" class="ghost" (click)="quick=null">Annuler</button>
            </div>
          </div>
          <div class="full quick" *ngIf="quick==='brand'">
            <b>Nouvelle marque</b>
            <input [(ngModel)]="draft.name" name="newBrand" placeholder="Nom de la marque">
            <div class="quick-actions">
              <button type="button" (click)="createBrand()" [disabled]="busy">Ajouter</button>
              <button type="button" class="ghost" (click)="quick=null">Annuler</button>
            </div>
          </div>
          <label *ngIf="!seller">Vendeur
            <select [(ngModel)]="form.vendorId" name="vendorId">
              <option [ngValue]="null">Aucun</option>
              <option *ngFor="let v of vendors" [ngValue]="v.id">{{v.name}}</option>
            </select>
          </label>
          <label *ngIf="seller">Boutique
            <input [value]="auth.user()?.shopName || 'Ma boutique'" disabled>
          </label>
          <label>Unité
            <div class="pick">
              <select [(ngModel)]="form.unit" name="unit">
                <option *ngFor="let u of unitOptions" [ngValue]="u">{{u}}</option>
              </select>
              <button type="button" class="add" *ngIf="!seller" (click)="openQuick('unit')">+</button>
            </div>
          </label>
          <div class="full quick" *ngIf="quick==='unit'">
            <b>Nouvelle unité</b>
            <input [(ngModel)]="draft.name" name="newUnit" placeholder="Nom (ex. carton, kg, pièce)">
            <input [(ngModel)]="draft.symbol" name="newUnitSymbol" placeholder="Symbole (ex. kg)">
            <div class="quick-actions">
              <button type="button" (click)="createUnit()" [disabled]="busy">Ajouter</button>
              <button type="button" class="ghost" (click)="quick=null">Annuler</button>
            </div>
          </div>
          <label>Prix (FCFA)
            <input type="number" min="1" [(ngModel)]="form.price" name="price" required>
          </label>
          <label>Prix promo
            <input type="number" min="1" [(ngModel)]="form.promoPrice" name="promoPrice" placeholder="Optionnel">
          </label>
          <label>Référence (SKU)
            <input [(ngModel)]="form.sku" name="sku" (ngModelChange)="skuManual=true" placeholder="Générée automatiquement">
          </label>
          <label class="full">Code-barres ou QR
            <div class="combo">
              <input [(ngModel)]="form.barcode" name="barcode" placeholder="EAN-13, UPC, QR…" maxlength="255">
              <button type="button" class="cam" (click)="startScan()" title="Scanner avec l’appareil photo">📷 Scanner</button>
              <button type="button" class="cam photo" (click)="pickShot()" title="Photographier le code">📷 Photo</button>
            </div>
            <small class="hint">Utilisez la caméra pour lire un code-barres ou un QR code.</small>
          </label>
        </div>
        <aside class="preview">
          <p>Aperçu vitrine</p>
          <article>
            <img [src]="vitrineUrl || 'assets/product-placeholder.svg'" alt="">
            <b>{{form.name || 'Nouveau produit'}}</b>
            <strong>{{priceLabel}}</strong>
            <small>{{vendorName || 'Vendeur à confirmer'}}</small>
          </article>
        </aside>
      </div>

      <div class="pane photos" *ngIf="step===2">
        <app-product-photo-studio
          [productId]="form.id"
          [barcode]="form.barcode"
          [urls]="form.images"
          (urlsChange)="onStudioUrls($event)"
          (productPrefill)="onStudioProduct($event)">
        </app-product-photo-studio>
        <div class="lib-row">
          <button type="button" class="ghost" (click)="media.open()">Choisir dans la bibliothèque</button>
          <app-image-picker #media [embed]="false" (urlChange)="addFromLib($event)"></app-image-picker>
        </div>
        <div class="vitrine-pick" *ngIf="form.images.length">
          <p>Image vitrine (carte produit sur le marché)</p>
          <div class="thumbs">
            <button type="button" *ngFor="let img of form.images; let i = index" [class.on]="isVitrine(img)" (click)="setMain(i)">
              <img [src]="img" alt="">
              <span *ngIf="isVitrine(img)">Vitrine</span>
            </button>
          </div>
        </div>
      </div>

      <div class="pane fiche" *ngIf="step===3">
        <div class="fields">
          <label class="full">Résumé
            <input [(ngModel)]="form.shortDescription" name="shortDescription" placeholder="Une ligne visible sur la carte produit">
          </label>
          <label class="full">Description
            <textarea [(ngModel)]="form.description" name="description" placeholder="Usage, contenu du colis, conseils d’utilisation…"></textarea>
          </label>
          <div class="full specs">
            <span>Caractéristiques</span>
            <div class="spec-row" *ngFor="let s of form.specifications; let i = index">
              <input [(ngModel)]="s.label" [name]="'specL'+i" placeholder="Libellé (ex. Poids)">
              <input [(ngModel)]="s.value" [name]="'specV'+i" placeholder="Valeur (ex. 1,2 kg)">
              <button type="button" (click)="removeSpec(i)">Retirer</button>
            </div>
            <button type="button" class="ghost" (click)="addSpec()">+ Caractéristique</button>
          </div>
          <label class="check" *ngIf="!seller"><input type="checkbox" [(ngModel)]="form.featured" name="featured"> Mettre en avant sur l’accueil</label>
        </div>
        <aside class="preview">
          <p>Prêt à publier</p>
          <article>
            <img [src]="vitrineUrl || 'assets/product-placeholder.svg'" alt="">
            <b>{{form.name}}</b>
            <strong>{{priceLabel}}</strong>
            <small>{{catName}} · {{vendorName || 'Sans vendeur'}}</small>
            <em *ngIf="form.shortDescription">{{form.shortDescription}}</em>
          </article>
          <div class="vitrine-pick" *ngIf="form.images.length>1">
            <p>Choisir l’image vitrine</p>
            <div class="thumbs">
              <button type="button" *ngFor="let img of form.images; let i = index" [class.on]="isVitrine(img)" (click)="setMain(i)">
                <img [src]="img" alt="">
                <span *ngIf="isVitrine(img)">Vitrine</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </form>

    <footer>
      <button type="button" class="ghost" (click)="cancel()">Annuler</button>
      <span class="grow"></span>
      <button type="button" class="ghost" *ngIf="step>1" (click)="back()">Retour</button>
      <button type="button" *ngIf="step<3" (click)="next()" [disabled]="busy">Continuer</button>
      <ng-container *ngIf="step===3">
        <button type="button" class="ghost" *ngIf="!form.id" (click)="save(false)" [disabled]="busy">Brouillon</button>
        <button type="button" (click)="save(true)" [disabled]="busy">{{busy ? 'Publication…' : (form.id ? 'Enregistrer' : 'Publier sur la vitrine')}}</button>
      </ng-container>
    </footer>

    <div class="scan" *ngIf="scanning">
      <div class="scan-head">
        <b>Scanner un code</b>
        <button type="button" class="x" (click)="stopScan()" aria-label="Fermer le scanner">×</button>
      </div>
      <p>{{scanHint}}</p>
      <div id="dibidani-reader"></div>
      <div class="scan-actions">
        <button type="button" class="ghost" (click)="pickShot()">📷 Photo du code</button>
        <button type="button" class="ghost" (click)="stopScan()">Fermer</button>
      </div>
    </div>
  </section>
</div>
`,
  styles: [`
.scrim{position:fixed;inset:0;z-index:80;background:rgba(6,30,24,.55);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
.sheet{position:relative;width:min(920px,100%);max-height:min(92vh,860px);background:#fff;border-radius:16px;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(6,30,24,.28);overflow:hidden}
header{display:flex;justify-content:space-between;align-items:flex-start;padding:18px 20px 8px;gap:12px}
.kicker{margin:0;color:#087a47;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
h2{margin:2px 0 0;font-size:20px}
.x{border:0;background:#f3f7f5;width:36px;height:36px;border-radius:18px;font-size:22px;line-height:1;cursor:pointer;color:#173b30}
.steps{display:flex;gap:8px;list-style:none;margin:0;padding:0 20px 12px}
.steps li{display:flex;align-items:center;gap:8px;color:#8a9893;font-size:12px;font-weight:700;flex:1}
.steps b{width:22px;height:22px;border-radius:11px;background:#e8eeeb;display:grid;place-items:center;font-size:11px}
.steps .on,.steps .done{color:#087a47}
.steps .on b,.steps .done b{background:#087a47;color:#fff}
.body{padding:4px 20px 12px;overflow:auto;min-height:0;flex:1}
.pane{display:grid;grid-template-columns:1.4fr .8fr;gap:16px}
.pane.photos{grid-template-columns:1fr}
.lib-row{margin-top:10px}
.lib-row .ghost{background:#fff;color:#087a47;border:1px solid #c5ddd2}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.full{grid-column:1/-1}
label,.specs span{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#4c5e57;font-weight:700}
input,select,textarea{border:1px solid #d7e2de;border-radius:8px;padding:9px 10px;font:inherit;background:#fff;width:100%}
textarea{min-height:110px;resize:vertical}
.pick,.combo{display:flex;gap:6px;align-items:stretch}
.pick select,.combo input{flex:1}
.add,.cam{border:0;background:#087a47;color:#fff;border-radius:8px;padding:0 12px;font-weight:800;cursor:pointer;white-space:nowrap}
.add{min-width:40px;font-size:20px;line-height:1}
.cam{font-size:13px}
.quick{background:#f6f9f7;border:1px dashed #b7cfc4;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px}
.quick b{font-size:12px;color:#087a47}
.quick-actions{display:flex;gap:8px}
.quick-actions button,.ghost{border:0;background:#087a47;color:#fff;border-radius:6px;padding:7px 10px;cursor:pointer;font-size:12px;font-weight:700}
.quick-actions .ghost,.spec-row button,.shots button{background:#eaf4ef;color:#0a3026}
.preview{background:#f6f9f7;border:1px solid #e2e9e6;border-radius:12px;padding:12px}
.preview p{margin:0 0 8px;font-size:11px;font-weight:800;color:#6a7c75;text-transform:uppercase}
.preview article{background:#fff;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:4px}
.preview img{width:100%;height:120px;object-fit:contain;background:#f8fbfa;border-radius:8px}
.preview b{font-size:14px}
.preview strong{color:#087a47}
.preview small,.preview em{color:#6a7c75;font-size:12px;font-style:normal}
.vitrine-pick{margin-top:12px}
.vitrine-pick p{margin:0 0 8px;font-size:12px;font-weight:800;color:#4c5e57}
.thumbs{display:flex;gap:8px;flex-wrap:wrap}
.thumbs button{position:relative;width:72px;height:72px;padding:0;border:2px solid #d7e2de;border-radius:8px;overflow:hidden;background:#fff;cursor:pointer}
.thumbs button.on{border-color:#087a47;box-shadow:0 0 0 2px #c5edd8}
.thumbs img{width:100%;height:100%;object-fit:contain;background:#f8fbfa}
.thumbs span{position:absolute;left:0;right:0;bottom:0;background:#087a47;color:#fff;font-size:9px;font-weight:800;text-transform:uppercase;padding:2px 0}
.drop{border:2px dashed #b7cfc4;border-radius:12px;padding:28px 16px;text-align:center;cursor:pointer;background:#f8fbfa;display:flex;flex-direction:column;gap:4px}
.drop.on{border-color:#087a47;background:#e8f7ef}
.drop.full{opacity:.5;pointer-events:none}
.drop b{color:#087a47}
.drop span{font-size:12px;color:#6a7c75}
.shots{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.shots article{width:110px;border:1px solid #d7e2de;border-radius:8px;padding:6px;display:flex;flex-direction:column;gap:4px}
.shots img{width:100%;height:72px;object-fit:contain;background:#f8fbfa;border-radius:6px}
.shots small{color:#087a47;font-weight:800;font-size:10px}
.shots button,.spec-row button{border:0;background:#eaf4ef;border-radius:6px;padding:5px 8px;cursor:pointer;font-size:12px;font-weight:700;color:#0a3026}
.hint{font-size:12px;color:#6a7c75;margin:4px 0 0;font-weight:500}
.specs{display:flex;flex-direction:column}
.spec-row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin:6px 0;align-items:center}
.check{flex-direction:row;align-items:center;gap:8px;font-size:13px}
.check input{width:auto}
footer{display:flex;gap:8px;align-items:center;padding:12px 20px 16px;border-top:1px solid #edf1ef}
.grow{flex:1}
footer button{background:#087a47;color:#fff;border:0;border-radius:8px;padding:10px 14px;font-weight:800;cursor:pointer}
footer .ghost,.scan-actions .ghost{background:#fff;color:#087a47;border:1px solid #c5ddd2}
footer button:disabled,.quick-actions button:disabled{opacity:.6;cursor:wait}
.err{color:#b42318;margin:0 20px 8px;font-size:13px}
.ok{color:#087a47;margin:0 20px 8px;font-size:13px}
.scan{position:absolute;inset:0;background:#0a3026;z-index:6;display:flex;flex-direction:column;padding:14px;color:#fff}
.scan-head{display:flex;justify-content:space-between;align-items:center}
.scan-head .x{background:#1a4a3c;color:#fff}
.scan p{font-size:13px;color:#c8ded6}
#dibidani-reader{flex:1;min-height:240px;border-radius:12px;overflow:hidden;background:#06241c}
.scan-actions{display:flex;gap:8px;margin-top:10px}
.scan-actions button{flex:1;border-radius:8px;padding:10px;font-weight:800;cursor:pointer}
@media(max-width:760px){
  .scrim{padding:0;align-items:stretch}
  .sheet{width:100%;max-height:100%;border-radius:0}
  .pane,.fields{grid-template-columns:1fr}
  .preview{display:none}
  .combo{flex-wrap:wrap}
  .cam{flex:1;padding:10px}
}
`]
})
export class ProductPublishDialogComponent {
  cats: any[] = [];
  vendors: any[] = [];
  brands: any[] = [];
  units: any[] = [];
  form: any = null;
  step: Step = 1;
  busy = false;
  err = '';
  hint = '';
  drag = false;
  skuManual = false;
  quick: QuickKind = null;
  draft: {name: string; parentId: number | null; symbol: string} = {name: '', parentId: null, symbol: ''};
  scanning = false;
  scanHint = '';
  @ViewChild('shot') shotInput?: ElementRef<HTMLInputElement>;
  private refsLoaded = false;
  private html5: any = null;

  constructor(private api: ApiService, public auth: AuthService, public publish: ProductPublishService) {
    effect(() => {
      const session = this.publish.session();
      untracked(() => {
        if (session) this.start(session);
        else this.teardown();
      });
    });
  }

  get seller() { return this.auth.isSeller(); }
  get open() { return !!this.publish.session() && !!this.form; }
  get priceLabel() {
    const n = Number(this.form?.promoPrice || this.form?.price || 0);
    return n ? 'FCFA ' + n.toLocaleString('fr-FR') : 'Prix à définir';
  }
  get vendorName() {
    if (this.seller) return this.auth.user()?.shopName || 'Ma boutique';
    return this.vendors.find(v => v.id === this.form?.vendorId)?.name;
  }
  get catName() { return this.cats.find(c => c.id === this.form?.categoryId)?.name; }
  get vitrineUrl() { return this.form?.mainImageUrl || this.form?.images?.[0] || ''; }
  isVitrine(img: string) { return !!img && this.vitrineUrl === img; }
  get unitOptions() {
    const names = this.units.map(u => u.name).filter(Boolean);
    const current = this.form?.unit;
    if (current && !names.includes(current)) names.unshift(current);
    if (!names.includes('unité')) names.unshift('unité');
    return names;
  }

  @ViewChild('media') media?: ImagePickerComponent;

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.media?.shown) return;
    if (this.scanning) { this.stopScan(); return; }
    if (this.quick) { this.quick = null; return; }
    if (this.open) this.cancel();
  }

  cancel() { this.stopScan(); this.publish.close(); }

  openQuick(kind: Exclude<QuickKind, null>) {
    this.quick = this.quick === kind ? null : kind;
    this.draft = {name: '', parentId: null, symbol: ''};
    this.err = '';
  }

  createCategory() {
    const name = this.draft.name.trim();
    if (!name) { this.err = 'Indiquez le nom de la catégorie.'; return; }
    this.busy = true; this.err = '';
    this.api.saveCategory({name, parentId: this.draft.parentId, active: true}).subscribe({
      next: c => {
        this.busy = false;
        this.quick = null;
        this.hint = 'Catégorie « ' + c.name + ' » ajoutée.';
        this.api.adminCategories().subscribe(rows => {
          this.cats = flatten(rows);
          this.form.categoryId = c.id;
        });
      },
      error: e => { this.busy = false; this.err = e.error?.message || 'Catégorie impossible.'; }
    });
  }

  createBrand() {
    const name = this.draft.name.trim();
    if (!name) { this.err = 'Indiquez le nom de la marque.'; return; }
    this.busy = true; this.err = '';
    this.api.saveBrand({name, active: true}).subscribe({
      next: b => {
        this.busy = false;
        this.quick = null;
        this.hint = 'Marque « ' + b.name + ' » ajoutée.';
        this.api.adminBrands().subscribe(rows => {
          this.brands = rows;
          this.form.brandId = b.id;
        });
      },
      error: e => { this.busy = false; this.err = e.error?.message || 'Marque impossible.'; }
    });
  }

  createUnit() {
    const name = this.draft.name.trim();
    if (!name) { this.err = 'Indiquez le nom de l’unité.'; return; }
    this.busy = true; this.err = '';
    this.api.saveUnit({name, symbol: this.draft.symbol.trim() || null, active: true}).subscribe({
      next: u => {
        this.busy = false;
        this.quick = null;
        this.hint = 'Unité « ' + u.name + ' » ajoutée.';
        this.api.adminUnits().subscribe(rows => {
          this.units = rows || [];
          this.form.unit = u.name;
        });
      },
      error: e => { this.busy = false; this.err = e.error?.message || 'Unité impossible.'; }
    });
  }

  pickShot() { this.shotInput?.nativeElement.click(); }

  startScan() {
    this.scanning = true;
    this.scanHint = 'Pointez un code-barres ou un QR code…';
    this.err = '';
    loadHtml5Qrcode().then(() => setTimeout(() => this.runScanner(), 40)).catch(() => {
      this.scanHint = 'Scanner indisponible. Prenez une photo du code.';
    });
  }

  scanPhoto(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.scanHint = this.scanning ? 'Lecture de la photo…' : this.scanHint;
    this.detectFromBitmap(file);
  }

  stopScan() {
    if (this.html5) {
      const h = this.html5;
      this.html5 = null;
      h.stop().then(() => h.clear()).catch(() => {});
    }
    this.scanning = false;
    this.scanHint = '';
  }

  next() {
    if (!this.validStep()) return;
    if (this.step === 1) this.ensureSku();
    this.step = (this.step + 1) as Step;
  }
  back() {
    if (this.step > 1) this.step = (this.step - 1) as Step;
  }

  addSpec() {
    this.form.specifications = [...(this.form.specifications || []), { label: '', value: '' }];
  }
  removeSpec(i: number) {
    this.form.specifications = this.form.specifications.filter((_: any, idx: number) => idx !== i);
  }

  onDrag(ev: DragEvent, over: boolean) {
    ev.preventDefault();
    this.drag = over;
  }
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.drag = false;
    this.addFiles(Array.from(ev.dataTransfer?.files || []));
  }
  uploadMany(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.addFiles(Array.from(input.files || []));
    input.value = '';
  }
  setMain(i: number) {
    const imgs = [...this.form.images];
    const [main] = imgs.splice(i, 1);
    if (!main) return;
    this.form.images = [main, ...imgs];
    this.form.mainImageUrl = main;
    this.hint = 'Image vitrine mise à jour.';
    if (!this.form.id) return;
    this.api.setProductVitrine(this.form.id, main).subscribe({
      next: r => {
        if (r?.images?.length) this.form.images = r.images;
        this.form.mainImageUrl = r?.mainImageUrl || main;
      },
      error: e => this.err = e.error?.message || 'Impossible de définir l’image vitrine.'
    });
  }
  removeImage(i: number) {
    this.form.images = this.form.images.filter((_: string, idx: number) => idx !== i);
    this.form.mainImageUrl = this.form.images[0] || '';
  }
  onStudioUrls(urls: string[]) {
    this.form.images = urls;
    this.form.mainImageUrl = urls[0] || this.form.mainImageUrl || '';
  }
  addFromLib(url: string) {
    if (!url || !this.form) return;
    const images: string[] = this.form.images || [];
    if (images.includes(url)) return;
    if (images.length >= 12) { this.err = '12 photos maximum.'; return; }
    this.form.images = [...images, url];
    if (!this.form.mainImageUrl) this.form.mainImageUrl = url;
  }
  onStudioProduct(p: any) {
    if (!p) return;
    this.form.sku = p.sku || this.form.sku;
    this.form.barcode = p.barcode || this.form.barcode;
    if (!this.form.name) this.form.name = p.name;
    if (p.productId && !this.form.id) {
      this.form.id = p.productId;
      this.hint = 'Produit existant associé. Les photos validées iront sur cette fiche.';
    }
  }

  save(publishNow: boolean) {
    if (!this.validStep()) return;
    this.ensureSku();
    this.busy = true;
    this.err = '';
    const images = (this.form.images || []).filter((u: string) => !!u);
    const main = this.form.mainImageUrl && images.includes(this.form.mainImageUrl) ? this.form.mainImageUrl : images[0] || null;
    const ordered = main ? [main, ...images.filter((u: string) => u !== main)] : images;
    const specifications = (this.form.specifications || [])
      .filter((s: any) => (s.label || '').trim() && (s.value || '').trim())
      .map((s: any) => ({ label: s.label.trim(), value: s.value.trim() }));
    const body = {
      ...this.form,
      barcode: normalizeCode(this.form.barcode) || null,
      images: ordered,
      specifications,
      mainImageUrl: main,
      price: Number(this.form.price),
      promoPrice: this.form.promoPrice ? Number(this.form.promoPrice) : null,
      active: publishNow,
      newArrival: !this.form.id
    };
    const req = this.seller ? this.api.saveSellerProduct(body, this.form.id) : this.api.saveProduct(body, this.form.id);
    req.subscribe({
      next: () => { this.busy = false; this.publish.markSaved(); },
      error: e => { this.busy = false; this.err = e.error?.message || 'Publication impossible.'; }
    });
  }

  ensureSku() {
    if (!this.form || (this.form.sku && this.skuManual)) return;
    if (this.form.id && this.form.sku) return;
    this.form.sku = suggestSku(this.form.name);
  }

  private start(session: ProductPublishSession) {
    this.step = 1;
    this.err = '';
    this.hint = '';
    this.busy = false;
    this.quick = null;
    this.skuManual = session.mode === 'edit';
    document.body.style.overflow = 'hidden';
    this.ensureRefs();
    if (session.draft) {
      this.form = fromDetail(session.draft);
      return;
    }
    if (session.id) {
      const get = this.seller ? this.api.sellerProduct(session.id) : this.api.adminProduct(session.id);
      get.subscribe({
        next: d => this.form = fromDetail(d),
        error: e => { this.err = e.error?.message || 'Produit introuvable.'; this.form = blankProduct(); }
      });
      return;
    }
    this.form = blankProduct();
    if (this.seller && this.auth.user()?.shopId) this.form.vendorId = this.auth.user()?.shopId;
  }

  private teardown() {
    this.stopScan();
    this.form = null;
    this.step = 1;
    this.err = '';
    this.hint = '';
    this.drag = false;
    this.quick = null;
    this.refsLoaded = false;
    document.body.style.overflow = '';
  }

  private ensureRefs() {
    if (this.refsLoaded) return;
    this.refsLoaded = true;
    if (this.seller) {
      this.api.categories().subscribe({next: c => this.cats = flatten(c), error: () => this.cats = []});
      this.api.brands().subscribe({next: b => this.brands = b || [], error: () => this.brands = []});
      this.units = [{name: 'unité'}, {name: 'pièce'}, {name: 'kg'}, {name: 'L'}, {name: 'carton'}, {name: 'sachet'}];
      const shopId = this.auth.user()?.shopId;
      const shopName = this.auth.user()?.shopName;
      this.vendors = shopId ? [{id: shopId, name: shopName || 'Ma boutique'}] : [];
      return;
    }
    this.api.adminCategories().subscribe(c => this.cats = flatten(c));
    this.api.adminVendors().subscribe(v => this.vendors = Array.isArray(v) ? v : (v.content || []));
    this.api.adminBrands().subscribe(b => this.brands = b);
    this.api.adminUnits().subscribe({next: u => this.units = u || [], error: () => this.units = []});
  }

  private validStep() {
    this.err = '';
    if (this.step !== 1) return true;
    if (!this.form?.name?.trim()) { this.err = 'Indiquez le nom du produit.'; return false; }
    if (!this.form.categoryId) { this.err = 'Choisissez une catégorie.'; return false; }
    if (!this.form.price || Number(this.form.price) <= 0) { this.err = 'Le prix doit être positif.'; return false; }
    if (this.form.promoPrice && Number(this.form.promoPrice) >= Number(this.form.price)) {
      this.err = 'Le prix promo doit être inférieur au prix normal.';
      return false;
    }
    return true;
  }

  private addFiles(files: File[]) {
    for (const file of files) {
      if ((this.form.images?.length || 0) >= 12) break;
      if (!file.type.startsWith('image/')) continue;
      this.api.upload(file).subscribe({
        next: r => {
          this.form.images = [...(this.form.images || []), r.url];
          if (!this.form.mainImageUrl) this.form.mainImageUrl = r.url;
        },
        error: e => this.err = uploadErrorMessage(e)
      });
    }
  }

  private runScanner() {
    const el = document.getElementById('dibidani-reader');
    if (!el || !this.scanning) return;
    const Html5Qrcode = (window as any).Html5Qrcode;
    this.html5 = new Html5Qrcode('dibidani-reader');
    this.html5.start(
      { facingMode: 'environment' },
      { fps: 8, qrbox: { width: 240, height: 160 } },
      (text: string) => this.onScanned(text),
      () => {}
    ).catch(() => {
      this.scanHint = 'Caméra refusée ou indisponible. Prenez une photo du code.';
    });
  }

  private onScanned(raw: string) {
    const code = normalizeCode(raw);
    if (!code) return;
    this.form.barcode = code;
    this.hint = 'Code lu : ' + code;
    this.stopScan();
  }

  private detectFromBitmap(file: File) {
    const Detector = (window as any).BarcodeDetector;
    if (Detector) {
      createImageBitmap(file).then(bmp => {
        const det = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code', 'data_matrix'] });
        return det.detect(bmp).then((codes: any[]) => {
          if (codes[0]?.rawValue) this.onScanned(codes[0].rawValue);
          else this.scanFileFallback(file);
        });
      }).catch(() => this.scanFileFallback(file));
      return;
    }
    this.scanFileFallback(file);
  }

  private scanFileFallback(file: File) {
    loadHtml5Qrcode().then(() => {
      const id = 'dibidani-reader-tmp';
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.display = 'none';
        document.body.appendChild(el);
      }
      const reader = new (window as any).Html5Qrcode(id);
      reader.scanFile(file, false).then((text: string) => this.onScanned(text)).catch(() => {
        this.err = 'Aucun code détecté. Saisissez-le à la main.';
      }).finally(() => {
        reader.clear().catch(() => {});
        el?.remove();
      });
    }).catch(() => { this.err = 'Impossible de lire ce code. Saisissez-le à la main.'; });
  }
}

function blankProduct() {
  return {
    sku: '', barcode: '', name: '', categoryId: null, vendorId: null, brandId: null,
    price: null, promoPrice: null, unit: 'unité', shortDescription: '', description: '',
    mainImageUrl: '', images: [], specifications: [{ label: '', value: '' }],
    featured: false, active: true
  };
}

function fromDetail(d: any) {
  const specs = (d.specifications || []).map((s: any) => ({ label: s.label, value: s.value }));
  const images = galleryOf(d);
  return {
    id: d.id, sku: d.sku, barcode: d.barcode || '', name: d.name, categoryId: d.category?.id, subcategoryId: d.subcategory?.id,
    vendorId: d.vendor?.id, brandId: d.brand?.id,
    price: d.price, promoPrice: d.promoPrice, unit: d.unit || 'unité',
    shortDescription: d.shortDescription || '', description: d.description || '',
    mainImageUrl: images[0] || '', images, specifications: specs.length ? specs : [{ label: '', value: '' }],
    featured: !!d.featured, active: d.active !== false
  };
}

function galleryOf(d: any): string[] {
  const out: string[] = [];
  const add = (u?: string) => { if (u && !out.includes(u)) out.push(u); };
  add(d.mainImageUrl);
  (d.images || []).forEach(add);
  return out;
}

function flatten(rows: any[], out: any[] = [], prefix = ''): any[] {
  for (const c of rows || []) {
    out.push({ ...c, label: prefix + c.name });
    if (c.children?.length) flatten(c.children, out, prefix + '— ');
  }
  return out;
}

function suggestSku(name: string) {
  const slug = (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 18);
  const tail = Date.now().toString(36).toUpperCase().slice(-5);
  return 'DBD-' + (slug || 'PROD') + '-' + tail;
}

function normalizeCode(raw: string) {
  const t = (raw || '').trim();
  if (!t) return '';
  const ean = t.match(/\b(\d{8}|\d{12,14})\b/);
  if (ean) return ean[1];
  return t.replace(/\s+/g, '').slice(0, 255);
}

function loadHtml5Qrcode() {
  if ((window as any).Html5Qrcode) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });
}
