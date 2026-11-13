import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, timer, exhaustMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { uploadErrorMessage } from '../core/image-upload';
import { PhotoEditorComponent } from './photo-editor.component';

type ShotStatus = 'uploading' | 'queued' | 'processing' | 'ready' | 'failed';

interface Shot {
  key: string;
  assetId?: number;
  jobId?: number;
  originalUrl: string;
  previewUrl: string;
  catalogUrl?: string;
  status: ShotStatus;
  message: string;
  file?: File;
  name?: string;
  bytes?: number;
  format?: string;
}

@Component({
  selector: 'app-product-photo-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, PhotoEditorComponent],
  template: `
<div class="studio">
  <div class="drop" [class.on]="drag" [class.full]="shots.length>=12"
       (dragover)="onDrag($event,true)" (dragleave)="onDrag($event,false)" (drop)="onDrop($event)">
    <b>Studio photo Dibidani</b>
    <span>Importez vos photos, choisissez les réglages communs puis vérifiez chaque résultat. Les originaux sont conservés.</span>
    <div class="cta">
      <label class="btn">📷 Photographier
        <input type="file" accept="image/*" capture="environment" hidden (change)="pickFiles($event)">
      </label>
      <label class="btn ghost">Importer
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" multiple hidden (change)="pickFiles($event)">
      </label>
      <button type="button" class="ghost" (click)="startLiveCam()" *ngIf="!live && canLiveCam">Caméra live</button>
    </div>
  </div>

  <fieldset class="export-options" [disabled]="shotsBusy">
    <legend>Réglages du studio IA</legend>
    <label>Modèle local<select [(ngModel)]="model"><option *ngFor="let m of models" [value]="m.id">{{m.id}}</option></select></label>
    <label>Fond<select [(ngModel)]="background"><option value="white">Blanc</option><option value="transparent">Transparent</option><option value="gray">Gris clair</option><option value="custom">Personnalisé</option></select></label>
    <label *ngIf="background==='custom'">Couleur<input type="color" [(ngModel)]="backgroundColor"></label>
    <label>Format<select [(ngModel)]="format"><option value="webp">WebP</option><option value="png">PNG</option><option value="jpeg">JPEG (fond opaque)</option></select></label>
    <label>Dimensions<select [(ngModel)]="preset" (ngModelChange)="setDimensions()"><option [ngValue]="400">400 × 400</option><option [ngValue]="800">800 × 800</option><option [ngValue]="1200">1200 × 1200</option><option [ngValue]="0">Personnalisées</option></select></label>
    <label *ngIf="!preset">Largeur<input type="number" min="100" max="2400" [(ngModel)]="width"></label>
    <label *ngIf="!preset">Hauteur<input type="number" min="100" max="2400" [(ngModel)]="height"></label>
    <label>Qualité {{quality}} %<input type="range" min="40" max="100" [(ngModel)]="quality"></label>
    <label>Rotation<select [(ngModel)]="rotation"><option [ngValue]="0">0°</option><option [ngValue]="90">90°</option><option [ngValue]="180">180°</option><option [ngValue]="270">270°</option></select></label>
    <label>Luminosité<input type="range" min="0.5" max="1.5" step="0.05" [(ngModel)]="brightness"></label>
    <label>Contraste<input type="range" min="0.5" max="1.5" step="0.05" [(ngModel)]="contrast"></label>
    <label><input type="checkbox" [(ngModel)]="refineEdges"> Affiner les contours (plus lent)</label>
    <button type="button" class="ghost" (click)="runBatch()" [disabled]="!shots.length">Appliquer aux photos importées</button>
  </fieldset>

  <p class="err" *ngIf="err">{{err}}</p>
  <p class="ok" *ngIf="hint">{{hint}}</p>
  <app-photo-editor *ngIf="editorSource" [src]="editorSource" (closed)="editorSource=''" (saved)="saveEdit($event)"></app-photo-editor>
  <p class="lookup" *ngIf="found">Fiche trouvée : <b>{{found.name}}</b> ({{found.sku}})
    <button type="button" class="ghost" (click)="useFound()">Préremplir</button>
  </p>

  <div class="live" *ngIf="live">
    <video #video autoplay playsinline muted></video>
    <div class="live-actions">
      <button type="button" (click)="captureLive()">Capturer</button>
      <button type="button" class="ghost" (click)="stopLive()">Fermer</button>
    </div>
  </div>

  <article class="shot" *ngFor="let s of shots; let i = index" [class.on]="current===i" [class.vitrine]="isVitrine(s)">
    <b>{{s.name || 'Photo du produit'}}</b>
    <div class="badge" *ngIf="isVitrine(s)">Image vitrine</div>
    <div class="compare" (click)="current=i">
      <div>
        <small>Avant</small>
        <img [src]="s.originalUrl" alt="Original">
      </div>
      <div>
        <small>{{s.status==='ready' ? 'Après' : 'Aperçu'}}</small>
        <img [src]="s.previewUrl || s.originalUrl" alt="Résultat">
        <div class="bar" *ngIf="s.status==='uploading' || s.status==='queued' || s.status==='processing'">
          <i [style.width]="s.status==='processing' ? '70%' : s.status==='queued' ? '35%' : '15%'"></i>
        </div>
      </div>
    </div>
    <p class="msg" [class.bad]="s.status==='failed'">{{label(s)}}</p>
    <div class="tools" *ngIf="current===i">
      <button type="button" (click)="openEditor(s.originalUrl)" [disabled]="busy(s)">Retoucher l’original</button>
      <button type="button" class="ghost" (click)="openEditor(s.previewUrl)" [disabled]="busy(s) || !s.previewUrl">Retoucher le résultat</button>
      <button type="button" (click)="run(s)" [disabled]="busy(s)">✨ Supprimer le fond</button>
      <button type="button" class="ghost" (click)="run(s,{background:'white',whiteBackground:true,removeBackground:true,recenter:true,watermark:false})" [disabled]="busy(s)">Fond blanc</button>
      <button type="button" class="ghost" (click)="run(s,{recenter:true,whiteBackground:true,force:true})" [disabled]="busy(s)">Recentrer</button>
      <button type="button" class="ghost" (click)="run(s,{watermark:true,whiteBackground:true,removeBackground:true,recenter:true,force:true})" [disabled]="busy(s)">Ajouter signature</button>
      <button type="button" class="ghost" (click)="restart(s)" [disabled]="busy(s)">Restaurer l’original</button>
      <button type="button" class="ghost" (click)="retry(s)" *ngIf="s.status==='failed'">Réessayer</button>
      <label>Zoom <input type="range" min="70" max="160" [(ngModel)]="zoom" (change)="applyCrop(s)"></label>
      <label>Horizontal <input type="range" min="-30" max="30" [(ngModel)]="offX" (change)="applyCrop(s)"></label>
      <label>Vertical <input type="range" min="-30" max="30" [(ngModel)]="offY" (change)="applyCrop(s)"></label>
    </div>
    <div class="row">
      <button type="button" class="ghost" (click)="makeVitrine(s)" *ngIf="!isVitrine(s)" [disabled]="busy(s) || vitrineBusy">Définir comme image vitrine</button>
      <button type="button" (click)="validate(s, isVitrine(s) || shots.length===1)" [disabled]="s.status!=='ready'">Enregistrer dans le produit</button>
      <a *ngIf="s.status==='ready'" [href]="s.previewUrl" [download]="'dibidani.'+(s.format || 'webp')">Télécharger l’image</a>
      <span *ngIf="s.bytes">{{s.bytes / 1024 | number:'1.0-0'}} Ko</span>
      <button type="button" class="ghost" (click)="remove(i)" [disabled]="busy(s)">Retirer</button>
    </div>
  </article>
</div>
`,
  styles: [`
.studio{display:flex;flex-direction:column;gap:12px}
.export-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;border:1px solid #c5ddd2;border-radius:12px;padding:12px}.export-options label{display:flex;flex-direction:column;gap:5px;font-size:12px}.export-options select,.export-options input{max-width:100%;padding:6px}.export-options legend{color:#087a47;font-weight:700}
.drop{border:2px dashed #b7cfc4;border-radius:12px;padding:20px 14px;text-align:center;background:#f8fbfa}
.drop.on{border-color:#087a47;background:#e8f7ef}
.drop.full{opacity:.55;pointer-events:none}
.drop b{display:block;color:#087a47;margin-bottom:4px}
.drop span{font-size:12px;color:#6a7c75}
.cta{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px}
.cta button,.cta .btn,.tools button,.row button{border:0;background:#087a47;color:#fff;border-radius:8px;padding:8px 12px;font-weight:800;cursor:pointer;font:inherit;display:inline-flex;align-items:center;justify-content:center;min-height:40px}
.ghost{background:#fff !important;color:#087a47 !important;border:1px solid #c5ddd2 !important}
.err{color:#b42318;font-size:13px;margin:0}.ok{color:#087a47;font-size:13px;margin:0}
.lookup{font-size:13px;background:#eaf7f0;border-radius:8px;padding:8px}
.shot{position:relative;border:1px solid #e2e9e6;border-radius:12px;padding:10px;background:#fff}
.shot.on,.shot.vitrine{border-color:#087a47}
.badge{position:absolute;top:8px;left:8px;z-index:1;background:#087a47;color:#fff;font-size:10px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;border-radius:6px;padding:3px 7px}
.compare{display:grid;grid-template-columns:1fr 1fr;gap:8px;cursor:pointer}
.compare img{width:100%;height:160px;object-fit:contain;background:repeating-conic-gradient(#eee 0% 25%,#fff 0% 50%) 0 0/16px 16px;border:1px solid #edf1ef;border-radius:8px}
.compare small{font-size:10px;font-weight:800;color:#6a7c75;text-transform:uppercase}
.bar{height:4px;background:#e8eeeb;border-radius:2px;margin-top:6px;overflow:hidden}
.bar i{display:block;height:100%;background:#087a47}
.tools{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.tools label{font-size:11px;color:#4c5e57;font-weight:700;display:flex;flex-direction:column;min-width:120px}
.row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.msg{font-size:12px;color:#4c5e57;margin:6px 0}.msg.bad{color:#b42318}
.live{background:#0a3026;border-radius:12px;padding:10px;color:#fff}
.live video{width:100%;max-height:280px;border-radius:8px;background:#06241c}
.live-actions{display:flex;gap:8px;margin-top:8px}
@media(max-width:640px){.compare img{height:120px}.cta button,.cta .btn{flex:1;min-height:44px}}
`]
})
export class ProductPhotoStudioComponent implements OnDestroy, OnChanges {
  @Input() productId: number | null = null;
  @Input() barcode = '';
  @Input() urls: string[] = [];
  @Output() urlsChange = new EventEmitter<string[]>();
  @Output() productPrefill = new EventEmitter<any>();

  shots: Shot[] = [];
  current = 0;
  vitrineBusy = false;
  drag = false;
  err = '';
  hint = '';
  found: any = null;
  zoom = 100;
  offX = 0;
  offY = 0;
  live = false;
  editorSource = '';
  models: {id: string; loaded: boolean}[] = [];
  model = 'isnet-general-use';
  background = 'white'; backgroundColor = '#FFFFFF'; format = 'webp';
  preset = 1200; width = 1200; height = 1200; quality = 82;
  rotation = 0; brightness = 1; contrast = 1; refineEdges = false;
  maxBytes = 10 * 1024 * 1024;
  get shotsBusy() { return this.shots.some(s => this.busy(s)); }
  setDimensions() { if (this.preset) this.width = this.height = this.preset; }
  private localUrls = new Set<string>();
  private lastCode = '';
  private polls = new Map<number, Subscription>();
  private stream?: MediaStream;
  private destroyed = false;

  constructor(private api: ApiService) {
    this.api.studioModels().subscribe({next: r => { this.models = r.models || []; this.model = r.default || this.model; this.maxBytes=r.maxBytes || this.maxBytes; },
      error: () => this.err = 'Le moteur IA est indisponible. Vous pouvez importer les photos puis réessayer.'});
  }

  get canLiveCam() {
    return typeof navigator !== 'undefined'
      && !!navigator.mediaDevices?.getUserMedia
      && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  ngOnChanges(ch: SimpleChanges) {
    if (ch['urls']) this.hydrateUrls();
    if (ch['productId'] && this.productId) this.loadAssets();
    if (!this.productId && this.barcode && this.barcode !== this.lastCode) this.lookup(this.barcode);
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.polls.forEach(s => s.unsubscribe());
    this.localUrls.forEach(url => URL.revokeObjectURL(url));
    this.stopLive();
  }

  isVitrine(s: Shot) {
    return !!s.previewUrl && cleanUrl(this.urls[0] || '') === cleanUrl(s.previewUrl);
  }

  private shotUrl(s: Shot) { return cleanUrl(s.previewUrl); }

  private hydrateUrls() {
    for (const url of this.urls || []) {
      if (!url || this.shots.some(s => this.shotUrl(s) === url || s.originalUrl === url)) continue;
      this.shots = [...this.shots, {
        key: url, originalUrl: url, previewUrl: url, catalogUrl: url, status: 'ready', message: 'Photo du catalogue'
      }];
    }
  }

  private loadAssets() {
    if (!this.productId) return;
    this.api.studioImages(this.productId).subscribe({
      next: rows => {
        for (const a of rows || []) {
          const url = a.masterUrl || a.jpegUrl || a.catalogUrl;
          const existing = this.shots.find(s => s.assetId === a.id || (!!url && this.shotUrl(s) === url));
          if (existing) { existing.assetId = a.id; existing.catalogUrl = a.catalogUrl || url; existing.previewUrl = url; }
          else this.shots = [...this.shots, {
            key: 'asset-' + a.id, assetId: a.id, originalUrl: url || '', previewUrl: url || '', catalogUrl: a.catalogUrl || url,
            status: url ? 'ready' : 'failed', message: a.confirmed ? 'Photo du catalogue' : 'À traiter ou à valider', bytes: a.bytes, format: a.format
          }];
          this.api.studioOriginal(a.id).subscribe({next: blob => {
            if (this.destroyed) return;
            const shot = this.shots.find(s => s.assetId === a.id);
            if (!shot) return;
            const original = URL.createObjectURL(blob); this.localUrls.add(original);
            shot.originalUrl = original;
          }, error: () => {}});
        }
      },
      error: () => {}
    });
  }

  label(s: Shot) {
    if (s.status === 'uploading') return 'Envoi de la photo…';
    if (s.status === 'queued') return 'En file d’attente du studio…';
    if (s.status === 'processing') return 'L’intelligence artificielle prépare votre photo…';
    if (s.status === 'failed') return s.message || 'Traitement impossible. Recadrez manuellement ou réessayez.';
    return s.message || 'Prête à valider';
  }
  busy(s: Shot) { return s.status === 'uploading' || s.status === 'queued' || s.status === 'processing'; }

  onDrag(ev: DragEvent, over: boolean) { ev.preventDefault(); this.drag = over; }
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.drag = false;
    this.addFiles(Array.from(ev.dataTransfer?.files || []));
  }
  pickFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.addFiles(Array.from(input.files || []));
    input.value = '';
  }

  addFiles(list: File[]) {
    this.err = '';
    for (const file of list) {
      if (this.shots.length >= 12) break;
      if (!['image/jpeg','image/png','image/webp','image/heic','image/heif','image/gif'].includes(file.type) || file.size > this.maxBytes) {
        this.err = 'Formats acceptés : JPEG, PNG, WebP, GIF fixe ou HEIC. Maximum ' + Math.floor(this.maxBytes / 1024 / 1024) + ' Mo par photo.'; continue;
      }
      const url = URL.createObjectURL(file);
      this.localUrls.add(url);
      const shot: Shot = { key: file.name + Date.now(), name: file.name, originalUrl: url, previewUrl: url, status: 'uploading', message: '', file };
      this.shots = [...this.shots, shot];
      this.current = this.shots.length - 1;
      this.upload(shot, file);
    }
  }

  openEditor(url: string) {
    if (this.editorSource) {
      this.hint = 'Fermez la retouche en cours avant de choisir une autre photo.';
      return;
    }
    this.editorSource = url;
    this.hint = '';
  }

  saveEdit(file: File) {
    if (this.shots.length >= 12) {
      this.err = 'Retirez une photo avant d’ajouter la version retouchée (12 photos maximum). Vous pouvez aussi la télécharger en PNG.';
      return;
    }
    const url = URL.createObjectURL(file);
    this.localUrls.add(url);
    const shot: Shot = {key: 'edit-' + Date.now(), originalUrl: url, previewUrl: url, status: 'uploading', message: '', file};
    this.shots = [...this.shots, shot];
    this.current = this.shots.length - 1;
    this.editorSource = '';
    this.err = '';
    this.api.studioUpload(file, this.productId || undefined).subscribe({
      next: a => {
        shot.assetId = a.id;
        shot.status = 'ready';
        this.run(shot, {removeBackground: false, whiteBackground: true, enhance: false,
          watermark: false, recenter: true, zoom: 1, offsetX: 0, offsetY: 0, force: true});
      },
      error: e => { shot.status = 'failed'; shot.message = uploadErrorMessage(e); }
    });
  }

  private upload(shot: Shot, file: File) {
    this.api.studioUpload(file, this.productId || undefined).subscribe({
      next: a => {
        shot.assetId = a.id;
        shot.status = 'ready';
        this.run(shot);
      },
      error: e => { shot.status = 'failed'; shot.message = uploadErrorMessage(e); }
    });
  }

  run(shot: Shot, extra: Record<string, unknown> = {}) {
    if (!shot.assetId) return;
    if (this.busy(shot)) return;
    shot.status = 'queued';
    shot.message = '';
    const body = this.processBody(shot, extra);
    this.api.studioProcess(body).subscribe({
      next: job => {
        shot.jobId = job.id;
        this.applyJob(shot, job);
        if (job.status !== 'COMPLETED' && job.status !== 'FAILED') this.watch(shot);
      },
      error: e => { shot.status = 'failed'; shot.message = e.error?.message || 'Traitement impossible.'; }
    });
  }

  private processBody(shot: Shot, extra: Record<string, unknown> = {}) {
    const {force, ...settings} = extra;
    return {
      assetId: shot.assetId,
      productId: this.productId,
      removeBackground: extra['removeBackground'] !== false,
      whiteBackground: extra['whiteBackground'] !== false,
      enhance: extra['enhance'] === true,
      watermark: extra['watermark'] === true,
      recenter: extra['recenter'] !== false,
      zoom: this.zoom / 100,
      offsetX: this.offX / 100,
      offsetY: this.offY / 100,
      model: this.model, background: this.background, backgroundColor: this.backgroundColor,
      format: this.format, width: this.width, height: this.height, quality: this.quality,
      rotation: this.rotation, brightness: this.brightness, contrast: this.contrast, refineEdges: this.refineEdges,
      ...settings
    };
  }

  retry(s: Shot) { if (!s.assetId && s.file) { s.status='uploading'; this.upload(s,s.file); } else this.run(s); }
  runBatch() {
    const shots = this.shots.filter(s => s.assetId && !this.busy(s));
    if (!shots.length) return;
    shots.forEach(s => s.status='queued');
    this.api.studioBatch(shots.map(s => this.processBody(s))).subscribe({next: results => {
      for (const r of results) {
        const s = shots.find(s => s.assetId===r.assetId); if (!s) continue;
        if (r.job) { s.jobId=r.job.id; this.applyJob(s,r.job); this.watch(s); }
        else { s.status='failed'; s.message=r.error; }
      }
    }, error: () => shots.forEach(s => { s.status='failed'; s.message='Traitement du lot impossible. Réessayez.'; })});
  }

  applyCrop(shot: Shot) {
    if (!shot.assetId || this.busy(shot)) return;
    this.run(shot, { recenter: true, whiteBackground: true, force: true });
  }

  restart(shot: Shot) {
    this.zoom = 100; this.offX = 0; this.offY = 0;
    this.run(shot, { removeBackground: false, background: 'transparent', enhance: false, watermark: false, recenter: false, rotation: 0, brightness: 1, contrast: 1, zoom: 1, offsetX: 0, offsetY: 0 });
  }

  private applyJob(shot: Shot, job: any) {
    shot.status = job.status === 'COMPLETED' ? 'ready' : job.status === 'FAILED' ? 'failed' : job.status === 'PENDING' ? 'queued' : 'processing';
    shot.message = job.message || '';
    shot.bytes = job.asset?.bytes; shot.format = job.asset?.format;
    const url = job.asset?.masterUrl || job.asset?.jpegUrl;
    if (url) {
      shot.previewUrl = bust(url);
      shot.catalogUrl = job.asset.catalogUrl || url;
    }
  }

  private watch(shot: Shot) {
    if (!shot.jobId || this.destroyed) return;
    this.polls.get(shot.jobId)?.unsubscribe();
    const sub = timer(0, 1800).pipe(exhaustMap(() => this.api.studioJob(shot.jobId!))).subscribe({
      next: job => {
        this.applyJob(shot, job);
        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          this.polls.get(shot.jobId!)?.unsubscribe();
          this.polls.delete(shot.jobId!);
        }
      },
      error: () => { shot.status = 'failed'; shot.message = 'Suivi de tâche interrompu.'; this.polls.get(shot.jobId!)?.unsubscribe(); }
    });
    this.polls.set(shot.jobId, sub);
  }

  validate(shot: Shot, main: boolean) {
    if (!shot.assetId) return;
    this.api.studioConfirm(shot.assetId, { productId: this.productId, main }).subscribe({
      next: a => {
        const url = a.masterUrl || a.jpegUrl;
        if (!url) return;
        const next = this.urls.filter(u => u !== url);
        if (main) next.unshift(url); else next.push(url);
        this.urlsChange.emit(next.slice(0, 12));
        this.hint = main ? 'Photo enregistrée comme image vitrine.' : 'Photo enregistrée dans le catalogue.';
      },
      error: e => this.err = e.error?.message || 'Validation impossible.'
    });
  }

  makeVitrine(s: Shot) {
    const url = this.shotUrl(s);
    if (!url || this.vitrineBusy) return;
    this.shots = [s, ...this.shots.filter(x => x !== s)];
    this.current = 0;
    const next = [url, ...this.urls.filter(u => u !== url)];
    this.urlsChange.emit(next.slice(0, 12));
    this.hint = 'Cette photo est l’image vitrine du produit.';
    if (!this.productId) return;
    this.vitrineBusy = true;
    const done = () => this.vitrineBusy = false;
    const fail = (e: any) => { this.vitrineBusy = false; this.err = e.error?.message || 'Impossible de définir l’image vitrine.'; };
    if (s.assetId) {
      this.api.studioConfirm(s.assetId, { productId: this.productId, main: true }).subscribe({ next: done, error: fail });
      return;
    }
    this.api.setProductVitrine(this.productId, cleanUrl(url)).subscribe({ next: done, error: fail });
  }

  remove(i: number) {
    const s = this.shots[i];
    if (this.busy(s)) return;
    if (s.assetId) this.api.studioDelete(s.assetId).subscribe({ error: () => {} });
    const url = s.previewUrl;
    this.shots = this.shots.filter((_, idx) => idx !== i);
    this.urlsChange.emit(this.urls.filter(u => cleanUrl(u) !== cleanUrl(url)));
  }

  lookup(code: string) {
    const c = (code || '').trim();
    if (c.length < 8 || this.productId) { this.found = null; return; }
    this.lastCode = c;
    this.api.studioLookup(c).subscribe({
      next: r => {
        if (!r?.productId) { this.found = null; return; }
        this.found = r;
        this.hint = r.owned ? 'Produit déjà au catalogue.' : 'Produit trouvé.';
      },
      error: () => { this.found = null; }
    });
  }
  useFound() { if (this.found) this.productPrefill.emit(this.found); }

  async startLiveCam() {
    this.err = '';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      this.live = true;
      setTimeout(() => {
        const v = document.querySelector('.live video') as HTMLVideoElement | null;
        if (v) v.srcObject = this.stream!;
      }, 40);
    } catch {
      this.err = 'Caméra indisponible. Utilisez Photographier ou importez une image.';
    }
  }
  captureLive() {
    const v = document.querySelector('.live video') as HTMLVideoElement | null;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (!blob) return;
      this.addFiles([new File([blob], 'capture.jpg', { type: 'image/jpeg' })]);
      this.stopLive();
    }, 'image/jpeg', 0.92);
  }
  stopLive() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
    this.live = false;
  }
}

function cleanUrl(url: string) {
  if (!url) return url;
  return url.split('#')[0].split('?')[0];
}

function bust(url: string) {
  const base = cleanUrl(url);
  if (!base) return url;
  return base + '?v=' + Date.now();
}
